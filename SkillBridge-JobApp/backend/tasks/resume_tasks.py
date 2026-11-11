from celery_app import celery
from services.resume_parser import ResumeParser
from services.vector_service import VectorService
from pymongo import MongoClient
import os
import logging

logger = logging.getLogger(__name__)

resume_parser = ResumeParser()
vector_service = VectorService()

mongo_client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
mongo_db = mongo_client['skillbridge']
resumes_collection = mongo_db['resumes']


@celery.task(name='tasks.parse_resume_async')
def parse_resume_async(user_id: str, file_content: bytes, filename: str):
    """
    Asynchronously parse resume and store in databases
    """
    try:
        logger.info(f"Starting async resume parsing for user: {user_id}")

        # Parse resume
        parsed_result = resume_parser.parse_resume(file_content, filename)

        # Store in MongoDB and Qdrant
        # Implementation here

        logger.info(f"Resume parsing completed for user: {user_id}")

        return {
            'success': True,
            'user_id': user_id,
            'message': 'Resume parsed successfully'
        }

    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        return {
            'success': False,
            'user_id': user_id,
            'error': str(e)
        }


@celery.task(name='tasks.update_resume_vector')
def update_resume_vector(user_id: str, resume_id: str):
    """
    Update resume vector in Qdrant
    """
    try:
        logger.info(f"Updating resume vector for user: {user_id}")

        # Get resume from MongoDB
        from bson.objectid import ObjectId
        resume = resumes_collection.find_one({'_id': ObjectId(resume_id)})

        if not resume:
            return {'success': False, 'error': 'Resume not found'}

        # Regenerate embedding
        embedding_text = f"""
        Skills: {', '.join(resume['parsed_data'].get('skills', []))}
        """
        new_embedding = resume_parser.generate_embedding(embedding_text)

        # Update in Qdrant
        metadata = {
            'user_id': user_id,
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

        logger.info(f"Resume vector updated for user: {user_id}")

        return {'success': True, 'user_id': user_id}

    except Exception as e:
        logger.error(f"Error updating resume vector: {e}")
        return {'success': False, 'error': str(e)}
