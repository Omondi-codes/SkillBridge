from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import User, Job
from services.resume_parser import ResumeParser
from services.vector_service import VectorService
from services.job_matcher import JobMatcher
from utils.helpers import format_error_response, format_success_response, paginate_results
from utils.decorators import role_required
from datetime import datetime
import os
import logging

jobs_bp = Blueprint('jobs', __name__)
logger = logging.getLogger(__name__)

# Initialize services
resume_parser = ResumeParser()
vector_service = VectorService()
job_matcher = JobMatcher(vector_service)


def get_db():
    """Helper function to get MongoDB database"""
    return current_app.mongo_db


@jobs_bp.route('', methods=['POST'])
@jwt_required()
@role_required('employer', 'admin')
def create_job():
    """Create a new job posting"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        user_doc = db.users.find_one({'id': current_user_id})

        if not user_doc:
            return format_error_response("User not found", 404)

        user = User.from_mongo(user_doc)
        data = request.get_json()

        # Validate required fields
        required_fields = ['title', 'description', 'location']
        for field in required_fields:
            if field not in data:
                return format_error_response(f"Missing required field: {field}", 400)

        # Prepare job data
        job_data_dict = {
            'employer_id': current_user_id,
            'title': data['title'],
            'description': data['description'],
            'requirements': data.get('requirements'),
            'responsibilities': data.get('responsibilities'),
            'category': data.get('category'),
            'employment_type': data.get('employment_type'),
            'experience_level': data.get('experience_level'),
            'location': data['location'],
            'remote_allowed': data.get('remote_allowed', False),
            'salary_min': data.get('salary_min'),
            'salary_max': data.get('salary_max'),
            'salary_currency': data.get('salary_currency', 'KES'),
            'required_skills': data.get('required_skills', []),
            'preferred_skills': data.get('preferred_skills', []),
            'education_level': data.get('education_level'),
            'experience_years': data.get('experience_years', 0),
            'application_deadline': data.get('application_deadline'),
            'positions_available': data.get('positions_available', 1),
            'status': data.get('status', 'active')
        }

        # Create job object
        job = Job(job_data_dict)

        # Generate job embedding
        embedding_data = {
            'title': job.title,
            'description': job.description,
            'required_skills': job.required_skills or [],
            'preferred_skills': job.preferred_skills or [],
            'experience_years': job.experience_years,
            'location': job.location
        }
        job_embedding = job_matcher.generate_job_embedding(embedding_data)

        # Store vector in Qdrant
        vector_metadata = {
            'job_id': job.id,
            'required_skills': job.required_skills or [],
            'preferred_skills': job.preferred_skills or [],
            'experience_years': job.experience_years,
            'location': job.location,
            'employment_type': job.employment_type or '',
            'salary_min': job.salary_min or 0,
            'salary_max': job.salary_max or 0,
            'category': job.category or '',
            'company': user.company_name or ''
        }

        vector_id = vector_service.store_job_vector(
            job_id=job.id,
            embedding=job_embedding,
            metadata=vector_metadata
        )

        if not vector_id:
            return format_error_response("Failed to store job vector", 500)

        job.vector_id = vector_id

        # Store job in MongoDB
        job_mongo = job.to_mongo()
        result = db.jobs.insert_one(job_mongo)

        logger.info(f"Job created: {job.id} by employer: {current_user_id}")

        # Trigger job alert notifications asynchronously
        from tasks.job_tasks import check_job_alerts
        check_job_alerts.delay(job.id)

        return format_success_response(
            job.to_dict(include_employer=True),
            "Job created successfully",
            201
        )

    except Exception as e:
        logger.error(f"Create job error: {e}")
        return format_error_response("Failed to create job", 500)


@jobs_bp.route('', methods=['GET'])
def list_jobs():
    """List all active jobs with filters"""
    try:
        db = get_db()

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category = request.args.get('category')
        location = request.args.get('location')
        employment_type = request.args.get('employment_type')
        experience_level = request.args.get('experience_level')
        search = request.args.get('search')

        # Build MongoDB filter
        mongo_filter = {'status': 'active'}

        if category:
            mongo_filter['category'] = category
        if location:
            mongo_filter['location'] = {'$regex': location, '$options': 'i'}
        if employment_type:
            mongo_filter['employment_type'] = employment_type
        if experience_level:
            mongo_filter['experience_level'] = experience_level
        if search:
            mongo_filter['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]

        # Count total
        total = db.jobs.count_documents(mongo_filter)

        # Calculate pagination
        skip = (page - 1) * per_page

        # Query with pagination
        job_docs = list(db.jobs.find(mongo_filter)
                       .sort('posted_at', -1)
                       .skip(skip)
                       .limit(per_page))

        # Convert to Job objects and add employer data
        jobs = []
        for doc in job_docs:
            job = Job.from_mongo(doc)
            employer_data = None

            # Get employer info
            if job.employer_id:
                employer_doc = db.users.find_one({'id': job.employer_id})
                if employer_doc:
                    employer = User.from_mongo(employer_doc)
                    # Use email username as fallback if company_name is null
                    company_name = employer.company_name
                    if not company_name and employer.email:
                        company_name = employer.email.split('@')[0].replace('.', ' ').title()

                    employer_data = {
                        'id': employer.id,
                        'company_name': company_name,
                        'company_website': employer.company_website,
                        'company_logo': getattr(employer, 'company_logo', None),
                        'location': employer.location
                    }

            jobs.append(job.to_dict(include_employer=True, employer_data=employer_data))

        result = {
            'items': jobs,
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }

        return format_success_response(result)

    except Exception as e:
        logger.error(f"List jobs error: {e}")
        return format_error_response("Failed to retrieve jobs", 500)


@jobs_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details"""
    try:
        db = get_db()
        job_doc = db.jobs.find_one({'id': job_id})

        if not job_doc:
            return format_error_response("Job not found", 404)

        # Increment view count
        db.jobs.update_one(
            {'id': job_id},
            {'$inc': {'views_count': 1}}
        )

        job = Job.from_mongo(job_doc)

        # Get employer info
        employer_data = None
        if job.employer_id:
            employer_doc = db.users.find_one({'id': job.employer_id})
            if employer_doc:
                employer = User.from_mongo(employer_doc)
                employer_data = {
                    'id': employer.id,
                    'company_name': employer.company_name,
                    'company_website': employer.company_website,
                    'company_logo': getattr(employer, 'company_logo', None),
                    'location': employer.location
                }

        return format_success_response(job.to_dict(include_employer=True, employer_data=employer_data))

    except Exception as e:
        logger.error(f"Get job error: {e}")
        return format_error_response("Failed to retrieve job", 500)


@jobs_bp.route('/<job_id>', methods=['PUT'])
@jwt_required()
@role_required('employer', 'admin')
def update_job(job_id):
    """Update job posting"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        job_doc = db.jobs.find_one({'id': job_id})

        if not job_doc:
            return format_error_response("Job not found", 404)

        job = Job.from_mongo(job_doc)

        # Check ownership (unless admin)
        if role != 'admin' and job.employer_id != current_user_id:
            return format_error_response("Access denied", 403)

        data = request.get_json()

        # Update fields
        updatable_fields = [
            'title', 'description', 'requirements', 'responsibilities',
            'category', 'employment_type', 'experience_level', 'location',
            'remote_allowed', 'salary_min', 'salary_max', 'salary_currency',
            'required_skills', 'preferred_skills', 'education_level',
            'experience_years', 'application_deadline', 'positions_available',
            'status'
        ]

        update_dict = {}
        for field in updatable_fields:
            if field in data:
                setattr(job, field, data[field])
                update_dict[field] = data[field]

        # Regenerate embedding if key fields changed
        if any(field in data for field in ['title', 'description', 'required_skills', 'preferred_skills']):
            embedding_data = {
                'title': job.title,
                'description': job.description,
                'required_skills': job.required_skills or [],
                'preferred_skills': job.preferred_skills or [],
                'experience_years': job.experience_years,
                'location': job.location
            }
            new_embedding = job_matcher.generate_job_embedding(embedding_data)

            # Update vector in Qdrant
            user_doc = db.users.find_one({'id': job.employer_id})
            user = User.from_mongo(user_doc)
            vector_metadata = {
                'job_id': job.id,
                'required_skills': job.required_skills or [],
                'preferred_skills': job.preferred_skills or [],
                'experience_years': job.experience_years,
                'location': job.location,
                'employment_type': job.employment_type or '',
                'salary_min': job.salary_min or 0,
                'salary_max': job.salary_max or 0,
                'category': job.category or '',
                'company': user.company_name or ''
            }

            vector_service.store_job_vector(
                job_id=job.id,
                embedding=new_embedding,
                metadata=vector_metadata
            )

        # Update job in MongoDB
        if update_dict:
            db.jobs.update_one(
                {'id': job_id},
                {'$set': update_dict}
            )

        logger.info(f"Job updated: {job_id}")

        return format_success_response(
            job.to_dict(include_employer=True),
            "Job updated successfully"
        )

    except Exception as e:
        logger.error(f"Update job error: {e}")
        return format_error_response("Failed to update job", 500)


@jobs_bp.route('/<job_id>', methods=['DELETE'])
@jwt_required()
@role_required('employer', 'admin')
def delete_job(job_id):
    """Delete job posting"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        job_doc = db.jobs.find_one({'id': job_id})

        if not job_doc:
            return format_error_response("Job not found", 404)

        job = Job.from_mongo(job_doc)

        # Check ownership (unless admin)
        if role != 'admin' and job.employer_id != current_user_id:
            return format_error_response("Access denied", 403)

        # Delete vector from Qdrant
        if job.vector_id:
            vector_service.delete_job_vector(job.vector_id)

        # Delete from MongoDB
        db.jobs.delete_one({'id': job_id})

        logger.info(f"Job deleted: {job_id}")

        return format_success_response(None, "Job deleted successfully")

    except Exception as e:
        logger.error(f"Delete job error: {e}")
        return format_error_response("Failed to delete job", 500)


@jobs_bp.route('/my-jobs', methods=['GET'])
@jwt_required()
@role_required('employer', 'admin')
def get_my_jobs():
    """Get all jobs posted by current employer"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')

        # Build MongoDB filter
        mongo_filter = {'employer_id': current_user_id}

        if status:
            mongo_filter['status'] = status

        # Count total
        total = db.jobs.count_documents(mongo_filter)

        # Calculate pagination
        skip = (page - 1) * per_page

        # Query with pagination
        job_docs = list(db.jobs.find(mongo_filter)
                       .sort('posted_at', -1)
                       .skip(skip)
                       .limit(per_page))

        # Convert to Job objects and add employer data
        jobs = []
        for doc in job_docs:
            job = Job.from_mongo(doc)
            employer_data = None

            # Get employer info
            if job.employer_id:
                employer_doc = db.users.find_one({'id': job.employer_id})
                if employer_doc:
                    employer = User.from_mongo(employer_doc)
                    # Use email username as fallback if company_name is null
                    company_name = employer.company_name
                    if not company_name and employer.email:
                        company_name = employer.email.split('@')[0].replace('.', ' ').title()

                    employer_data = {
                        'id': employer.id,
                        'company_name': company_name,
                        'company_website': employer.company_website,
                        'company_logo': getattr(employer, 'company_logo', None),
                        'location': employer.location
                    }

            jobs.append(job.to_dict(include_employer=True, employer_data=employer_data))

        result = {
            'items': jobs,
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }

        return format_success_response(result)

    except Exception as e:
        logger.error(f"Get my jobs error: {e}")
        return format_error_response("Failed to retrieve jobs", 500)


@jobs_bp.route('/<job_id>/close', methods=['POST'])
@jwt_required()
@role_required('employer', 'admin')
def close_job(job_id):
    """Close job posting"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        job_doc = db.jobs.find_one({'id': job_id})

        if not job_doc:
            return format_error_response("Job not found", 404)

        job = Job.from_mongo(job_doc)

        # Check ownership (unless admin)
        if role != 'admin' and job.employer_id != current_user_id:
            return format_error_response("Access denied", 403)

        # Update job status in MongoDB
        db.jobs.update_one(
            {'id': job_id},
            {'$set': {
                'status': 'closed',
                'closed_at': datetime.utcnow()
            }}
        )

        logger.info(f"Job closed: {job_id}")

        return format_success_response(None, "Job closed successfully")

    except Exception as e:
        logger.error(f"Close job error: {e}")
        return format_error_response("Failed to close job", 500)
