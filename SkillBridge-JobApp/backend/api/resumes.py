from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import User
from services.resume_parser import ResumeParser
from services.vector_service import VectorService
from utils.validators import allowed_file
from utils.helpers import format_error_response, format_success_response
from utils.decorators import role_required
from bson.objectid import ObjectId
import os
import logging
from datetime import datetime

resumes_bp = Blueprint('resumes', __name__)
logger = logging.getLogger(__name__)


def get_db():
    """Get MongoDB database instance"""
    return current_app.mongo_db


# Initialize services
resume_parser = ResumeParser()
vector_service = VectorService()


@resumes_bp.route('/upload', methods=['POST'])
@jwt_required()
@role_required('candidate')
def upload_resume():
    """Upload and parse resume"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        user_doc = db.users.find_one({'id': current_user_id})

        if not user_doc:
            return format_error_response("User not found", 404)

        user = User.from_mongo(user_doc)

        # Check if file is present
        if 'file' not in request.files:
            return format_error_response("No file provided", 400)

        file = request.files['file']

        if file.filename == '':
            return format_error_response("No file selected", 400)

        # Validate file
        if not allowed_file(file.filename):
            return format_error_response("Invalid file type. Allowed: PDF, DOC, DOCX, TXT", 400)

        # Read file content
        filename = secure_filename(file.filename)
        file_content = file.read()

        # Parse resume
        logger.info(f"Parsing resume for user: {current_user_id}")
        parsed_result = resume_parser.parse_resume(file_content, filename)

        # Extract metadata for vector storage
        parsed_data = parsed_result['parsed_data']

        # Calculate experience years from work history
        experience_years = 0
        if 'experience' in parsed_data and isinstance(parsed_data['experience'], list):
            for exp in parsed_data['experience']:
                if isinstance(exp, dict):
                    # Simple calculation - can be enhanced
                    experience_years += 1

        metadata = {
            'user_id': current_user_id,
            'skills': parsed_data.get('skills', []),
            'experience_years': experience_years,
            'location': parsed_data.get('personal_info', {}).get('location', user.location or ''),
            'education_level': '',
            'job_titles': [],
            'industries': []
        }

        # Extract education level
        if 'education' in parsed_data and isinstance(parsed_data['education'], list) and parsed_data['education']:
            education = parsed_data['education'][0]
            if isinstance(education, dict):
                metadata['education_level'] = education.get('degree', '')

        # Store vector in Qdrant
        vector_id = vector_service.store_resume_vector(
            user_id=current_user_id,
            embedding=parsed_result['embedding'],
            metadata=metadata
        )

        if not vector_id:
            return format_error_response("Failed to store resume vector", 500)

        # Store in MongoDB
        resume_doc = {
            'user_id': current_user_id,
            'raw_text': parsed_result['raw_text'],
            'parsed_data': parsed_data,
            'vector_id': vector_id,
            'filename': filename,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = db.resumes.insert_one(resume_doc)
        resume_id = str(result.inserted_id)

        logger.info(f"Resume uploaded successfully for user: {current_user_id}")

        return format_success_response({
            'resume_id': resume_id,
            'vector_id': vector_id,
            'parsed_data': parsed_data
        }, "Resume uploaded and parsed successfully", 201)

    except Exception as e:
        logger.error(f"Resume upload error: {e}")
        return format_error_response("Failed to upload resume", 500)


@resumes_bp.route('/<resume_id>', methods=['GET'])
@jwt_required()
def get_resume(resume_id):
    """Get resume details"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get resume from MongoDB
        resume = db.resumes.find_one({'_id': ObjectId(resume_id)})

        if not resume:
            return format_error_response("Resume not found", 404)

        # Check ownership or if employer viewing application
        if resume['user_id'] != current_user_id:
            # Check if current user is employer with access
            # For now, only allow owner to view
            return format_error_response("Access denied", 403)

        # Format response
        resume['_id'] = str(resume['_id'])
        resume['created_at'] = resume['created_at'].isoformat() if 'created_at' in resume else None
        resume['updated_at'] = resume['updated_at'].isoformat() if 'updated_at' in resume else None

        return format_success_response(resume)

    except Exception as e:
        logger.error(f"Get resume error: {e}")
        return format_error_response("Failed to retrieve resume", 500)


@resumes_bp.route('/<resume_id>', methods=['PUT'])
@jwt_required()
@role_required('candidate')
def update_resume(resume_id):
    """Update resume data"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get resume from MongoDB
        resume = db.resumes.find_one({'_id': ObjectId(resume_id)})

        if not resume:
            return format_error_response("Resume not found", 404)

        # Check ownership
        if resume['user_id'] != current_user_id:
            return format_error_response("Access denied", 403)

        data = request.get_json()

        # Update parsed data
        if 'parsed_data' in data:
            resume['parsed_data'].update(data['parsed_data'])

        resume['updated_at'] = datetime.utcnow()

        # Update in MongoDB
        db.resumes.update_one(
            {'_id': ObjectId(resume_id)},
            {'$set': resume}
        )

        # Regenerate embedding if skills changed
        if 'parsed_data' in data and 'skills' in data['parsed_data']:
            # Generate new embedding
            embedding_text = f"""
            Skills: {', '.join(resume['parsed_data'].get('skills', []))}
            """
            new_embedding = resume_parser.generate_embedding(embedding_text)

            # Update vector in Qdrant
            metadata = {
                'user_id': current_user_id,
                'skills': resume['parsed_data'].get('skills', []),
                'experience_years': len(resume['parsed_data'].get('experience', [])),
                'location': resume['parsed_data'].get('personal_info', {}).get('location', ''),
                'education_level': '',
                'job_titles': [],
                'industries': []
            }

            vector_service.update_resume_vector(
                vector_id=resume['vector_id'],
                embedding=new_embedding,
                metadata=metadata
            )

        logger.info(f"Resume updated: {resume_id}")

        return format_success_response(None, "Resume updated successfully")

    except Exception as e:
        logger.error(f"Update resume error: {e}")
        return format_error_response("Failed to update resume", 500)


@resumes_bp.route('/<resume_id>', methods=['DELETE'])
@jwt_required()
@role_required('candidate')
def delete_resume(resume_id):
    """Delete resume"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get resume from MongoDB
        resume = db.resumes.find_one({'_id': ObjectId(resume_id)})

        if not resume:
            return format_error_response("Resume not found", 404)

        # Check ownership
        if resume['user_id'] != current_user_id:
            return format_error_response("Access denied", 403)

        # Delete vector from Qdrant
        if 'vector_id' in resume:
            vector_service.delete_resume_vector(resume['vector_id'])

        # Delete from MongoDB
        db.resumes.delete_one({'_id': ObjectId(resume_id)})

        logger.info(f"Resume deleted: {resume_id}")

        return format_success_response(None, "Resume deleted successfully")

    except Exception as e:
        logger.error(f"Delete resume error: {e}")
        return format_error_response("Failed to delete resume", 500)


@resumes_bp.route('/', methods=['GET'])
@resumes_bp.route('', methods=['GET'])
@jwt_required()
@role_required('candidate')
def get_resumes():
    """Get all resumes for current user"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get all resumes for user
        resumes = list(db.resumes.find({'user_id': current_user_id}))

        # Format response
        for resume in resumes:
            resume['_id'] = str(resume['_id'])
            resume['created_at'] = resume['created_at'].isoformat() if 'created_at' in resume else None
            resume['updated_at'] = resume['updated_at'].isoformat() if 'updated_at' in resume else None
            # Remove raw_text from list view
            resume.pop('raw_text', None)

        return format_success_response(resumes)

    except Exception as e:
        logger.error(f"Get resumes error: {e}")
        return format_error_response("Failed to retrieve resumes", 500)


@resumes_bp.route('/my-resumes', methods=['GET'])
@jwt_required()
@role_required('candidate')
def get_my_resumes():
    """Get all resumes for current user (legacy endpoint)"""
    return get_resumes()
