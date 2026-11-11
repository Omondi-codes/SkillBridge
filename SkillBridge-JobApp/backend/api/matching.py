from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import User, Job, Application
from services.resume_parser import ResumeParser
from services.vector_service import VectorService
from services.job_matcher import JobMatcher
from utils.helpers import format_error_response, format_success_response
from utils.decorators import role_required
from datetime import datetime
from bson import ObjectId
import os
import logging

matching_bp = Blueprint('matching', __name__)
logger = logging.getLogger(__name__)

# Initialize services
resume_parser = ResumeParser()
vector_service = VectorService()
job_matcher = JobMatcher(vector_service)


def get_db():
    """Get MongoDB database instance from current Flask app"""
    return current_app.mongo_db


@matching_bp.route('/jobs', methods=['GET'])
@jwt_required()
@role_required('candidate')
def get_matched_jobs():
    """Get matched jobs for current candidate"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get candidate's latest resume
        resume = db.resumes.find_one(
            {'user_id': current_user_id},
            sort=[('created_at', -1)]
        )

        if not resume:
            return format_error_response("No resume found. Please upload a resume first.", 404)

        # Get filters from query params
        location = request.args.get('location')
        employment_type = request.args.get('employment_type')
        min_salary = request.args.get('min_salary', type=int)
        limit = request.args.get('limit', 10, type=int)

        filters = {}
        if location:
            filters['location'] = location
        if employment_type:
            filters['employment_type'] = employment_type
        if min_salary:
            filters['min_salary'] = min_salary

        # Get resume embedding from Qdrant or regenerate
        resume_embedding = None
        if 'vector_id' in resume:
            # In production, retrieve from Qdrant
            # For now, regenerate
            pass

        # Regenerate embedding
        embedding_text = f"""
        Skills: {', '.join(resume['parsed_data'].get('skills', []))}
        """
        resume_embedding = resume_parser.generate_embedding(embedding_text)

        # Prepare resume data
        resume_data = {
            'skills': resume['parsed_data'].get('skills', []),
            'experience_years': len(resume['parsed_data'].get('experience', [])),
            'location': resume['parsed_data'].get('personal_info', {}).get('location', '')
        }

        # Get matched jobs
        matches = job_matcher.match_jobs_for_candidate(
            resume_data=resume_data,
            resume_embedding=resume_embedding,
            filters=filters,
            limit=limit
        )

        # Enrich with job details
        enriched_matches = []
        for match in matches:
            job_doc = db.jobs.find_one({'id': match['job_id']})
            if job_doc and job_doc.get('status') == 'active':
                job = Job.from_mongo(job_doc)

                # Get employer info
                employer_data = None
                if job.employer_id:
                    employer_doc = db.users.find_one({'id': job.employer_id})
                    if employer_doc:
                        employer = User.from_mongo(employer_doc)
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

                match_data = {
                    'job': job.to_dict(include_employer=True, employer_data=employer_data),
                    'matching': {
                        'similarity_score': match['similarity_score'],
                        'overall_score': match['overall_score'],
                        'skill_match_percentage': match['skill_match_percentage'],
                        'experience_match': match['experience_match'],
                        'location_match': match['location_match'],
                        'details': match['match_details']
                    }
                }
                enriched_matches.append(match_data)

        logger.info(f"Found {len(enriched_matches)} matched jobs for user: {current_user_id}")

        return format_success_response({
            'matches': enriched_matches,
            'count': len(enriched_matches)
        })

    except Exception as e:
        logger.error(f"Get matched jobs error: {e}")
        return format_error_response("Failed to retrieve matched jobs", 500)


@matching_bp.route('/candidates', methods=['GET'])
@jwt_required()
@role_required('employer', 'admin')
def get_matched_candidates():
    """Get matched candidates for a job"""
    try:
        db = get_db()
        job_id = request.args.get('job_id')
        if not job_id:
            return format_error_response("job_id is required", 400)

        # Get job
        job_doc = db.jobs.find_one({'id': job_id})
        if not job_doc:
            return format_error_response("Job not found", 404)

        job = Job.from_mongo(job_doc)

        # Check ownership
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        if role != 'admin' and job.employer_id != current_user_id:
            return format_error_response("Access denied", 403)

        # Get filters
        location = request.args.get('location')
        min_experience = request.args.get('min_experience', type=int)
        limit = request.args.get('limit', 20, type=int)

        filters = {}
        if location:
            filters['location'] = location
        if min_experience:
            filters['min_experience'] = min_experience

        # Generate job embedding
        job_data = {
            'title': job.title,
            'description': job.description,
            'required_skills': job.required_skills or [],
            'preferred_skills': job.preferred_skills or [],
            'experience_years': job.experience_years,
            'location': job.location
        }
        job_embedding = job_matcher.generate_job_embedding(job_data)

        # Get matched candidates
        matches = job_matcher.match_candidates_for_job(
            job_data=job_data,
            job_embedding=job_embedding,
            filters=filters,
            limit=limit
        )

        # Enrich with candidate details
        enriched_matches = []
        for match in matches:
            user_doc = db.users.find_one({'id': match['user_id']})
            if user_doc and user_doc.get('is_active'):
                user = User.from_mongo(user_doc)
                # Get candidate's resume
                resume = db.resumes.find_one(
                    {'user_id': match['user_id']},
                    sort=[('created_at', -1)]
                )

                candidate_data = {
                    'candidate': user.to_dict(include_email=False),
                    'resume_summary': {
                        'skills': resume['parsed_data'].get('skills', []) if resume else [],
                        'experience_years': len(resume['parsed_data'].get('experience', [])) if resume else 0,
                        'education': resume['parsed_data'].get('education', []) if resume else []
                    } if resume else None,
                    'matching': {
                        'similarity_score': match['similarity_score'],
                        'overall_score': match['overall_score'],
                        'skill_match_percentage': match['skill_match_percentage'],
                        'experience_match': match['experience_match'],
                        'location_match': match['location_match']
                    }
                }
                enriched_matches.append(candidate_data)

        logger.info(f"Found {len(enriched_matches)} matched candidates for job: {job_id}")

        return format_success_response({
            'job': job.to_dict(),
            'matches': enriched_matches,
            'count': len(enriched_matches)
        })

    except Exception as e:
        logger.error(f"Get matched candidates error: {e}")
        return format_error_response("Failed to retrieve matched candidates", 500)


@matching_bp.route('/apply', methods=['POST'])
@jwt_required()
@role_required('candidate')
def apply_to_job():
    """Apply to a job"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if 'job_id' not in data:
            return format_error_response("job_id is required", 400)

        job_id = data['job_id']

        # Get job
        job_doc = db.jobs.find_one({'id': job_id})
        if not job_doc:
            return format_error_response("Job not found", 404)

        job = Job.from_mongo(job_doc)

        if job.status != 'active':
            return format_error_response("Job is not accepting applications", 400)

        # Check if already applied
        existing_application = db.applications.find_one({
            'job_id': job_id,
            'candidate_id': current_user_id
        })

        if existing_application:
            return format_error_response("You have already applied to this job", 409)

        # Get candidate's resume (prioritize primary resume, fallback to latest)
        resume = db.resumes.find_one(
            {'user_id': current_user_id, 'is_primary': True}
        )

        # If no primary resume, get the most recent one
        if not resume:
            resume = db.resumes.find_one(
                {'user_id': current_user_id},
                sort=[('created_at', -1)]
            )

        if not resume:
            return format_error_response("Please upload a resume before applying", 400)

        # Calculate matching score
        # Extract skills from nested structure
        parsed_data = resume.get('parsed_data', {})
        skills_data = parsed_data.get('skills', {})

        # Handle both flat list and nested skills structure
        if isinstance(skills_data, list):
            # Simple list of skills
            candidate_skills = skills_data
        elif isinstance(skills_data, dict):
            # Nested structure - extract from technical_skills and tools
            candidate_skills = []
            technical_skills = skills_data.get('technical_skills', {})

            # Extract from all technical skill categories
            if isinstance(technical_skills, dict):
                for category in technical_skills.values():
                    if isinstance(category, dict):
                        for subcategory in category.values():
                            if isinstance(subcategory, list):
                                candidate_skills.extend(subcategory)
                    elif isinstance(category, list):
                        candidate_skills.extend(category)
            elif isinstance(technical_skills, list):
                candidate_skills.extend(technical_skills)

            # Add tools if available
            tools = skills_data.get('tools', [])
            if isinstance(tools, list):
                candidate_skills.extend(tools)
        else:
            candidate_skills = []

        resume_data = {
            'skills': candidate_skills,
            'experience_years': len(parsed_data.get('work_experience', [])) or len(parsed_data.get('experience', [])),
            'location': parsed_data.get('personal_information', {}).get('location') or parsed_data.get('personal_info', {}).get('location', '')
        }

        job_payload = {
            'required_skills': job.required_skills or [],
            'preferred_skills': job.preferred_skills or [],
            'experience_years': job.experience_years,
            'location': job.location
        }

        match_details = job_matcher._calculate_detailed_match(resume_data, job_payload)

        # Create application
        application_data = {
            'job_id': job_id,
            'candidate_id': current_user_id,
            'resume_id': str(resume['_id']),
            'resume_vector_id': resume.get('vector_id'),
            'matching_score': match_details['overall_score'],
            'skill_match_percentage': match_details['skill_match_percentage'],
            'experience_match': match_details['experience_match'],
            'location_match': match_details['location_match'],
            'match_details': match_details,
            'cover_letter': data.get('cover_letter'),
            'custom_responses': data.get('custom_responses'),
            'status': 'pending'
        }

        application = Application(application_data)

        # Insert application
        application_doc = application.to_mongo()
        result = db.applications.insert_one(application_doc)
        application._id = result.inserted_id

        # Increment job applications count
        db.jobs.update_one(
            {'id': job_id},
            {'$inc': {'applications_count': 1}}
        )

        logger.info(f"Application created: {application.id} for job: {job_id}")

        return format_success_response(
            application.to_dict(include_job=True),
            "Application submitted successfully",
            201
        )

    except Exception as e:
        logger.error(f"Apply to job error: {e}")
        return format_error_response("Failed to submit application", 500)


@matching_bp.route('/applications', methods=['GET'])
@jwt_required()
@role_required('candidate')
def get_my_applications():
    """Get all applications for current candidate"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get query parameters
        status = request.args.get('status')

        # Build query
        query_filter = {'candidate_id': current_user_id}

        if status:
            query_filter['status'] = status

        # Order by most recent
        application_docs = list(db.applications.find(query_filter).sort('applied_at', -1))

        # Build applications with job details
        applications_with_jobs = []
        for doc in application_docs:
            app = Application.from_mongo(doc)
            job_data = None

            # Fetch job details
            if app.job_id:
                job_doc = db.jobs.find_one({'id': app.job_id})
                if job_doc:
                    job = Job.from_mongo(job_doc)

                    # Get employer info for the job
                    employer_data = None
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

                    job_data = job.to_dict(include_employer=True, employer_data=employer_data)

            applications_with_jobs.append(app.to_dict(include_job=True, job_data=job_data))

        result = {
            'applications': applications_with_jobs,
            'count': len(applications_with_jobs)
        }

        return format_success_response(result)

    except Exception as e:
        logger.error(f"Get my applications error: {e}")
        return format_error_response("Failed to retrieve applications", 500)


@matching_bp.route('/employer/applications', methods=['GET'])
@jwt_required()
@role_required('employer', 'admin')
def get_employer_applications():
    """Get all applications for all jobs posted by current employer"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        # Get query parameters
        status = request.args.get('status')
        job_id = request.args.get('job_id')
        sort_by = request.args.get('sort_by', 'date')  # 'date' or 'match'

        # First, get all jobs for this employer
        if role == 'admin':
            # Admin can see all jobs
            job_filter = {}
        else:
            job_filter = {'employer_id': current_user_id}

        employer_jobs = list(db.jobs.find(job_filter, {'id': 1, 'title': 1}))
        employer_job_ids = [job['id'] for job in employer_jobs]
        job_titles = {job['id']: job['title'] for job in employer_jobs}

        if not employer_job_ids:
            return format_success_response({
                'applications': [],
                'count': 0,
                'jobs': []
            })

        # Build query for applications
        query_filter = {'job_id': {'$in': employer_job_ids}}

        if status:
            query_filter['status'] = status

        if job_id:
            query_filter['job_id'] = job_id

        # Determine sort order
        if sort_by == 'match':
            sort_field = [('matching_score', -1)]
        else:
            sort_field = [('applied_at', -1)]

        # Get applications
        application_docs = list(db.applications.find(query_filter).sort(sort_field))

        applications = []
        for app_doc in application_docs:
            app = Application.from_mongo(app_doc)

            # Fetch candidate data
            candidate_data = None
            if app.candidate_id:
                candidate_doc = db.users.find_one({'id': app.candidate_id})
                if candidate_doc:
                    candidate = User.from_mongo(candidate_doc)
                    candidate_data = {
                        'id': candidate.id,
                        'first_name': candidate.first_name,
                        'last_name': candidate.last_name,
                        'email': candidate.email,
                        'phone': candidate.phone,
                        'location': candidate.location
                    }

            # Fetch job data
            job_data = None
            if app.job_id:
                job_doc = db.jobs.find_one({'id': app.job_id})
                if job_doc:
                    job = Job.from_mongo(job_doc)
                    job_data = {
                        'id': job.id,
                        'title': job.title,
                        'location': job.location,
                        'employment_type': job.employment_type,
                        'status': job.status
                    }

            app_dict = app.to_dict(include_candidate=True, candidate_data=candidate_data)
            app_dict['job'] = job_data
            app_dict['job_title'] = job_titles.get(app.job_id, 'Unknown Job')

            # Add flat candidate fields for frontend compatibility
            if candidate_data:
                app_dict['candidate_name'] = f"{candidate_data.get('first_name', '')} {candidate_data.get('last_name', '')}".strip() or 'Unknown Candidate'
                app_dict['candidate_email'] = candidate_data.get('email', '')
                app_dict['candidate_phone'] = candidate_data.get('phone')
                app_dict['candidate_location'] = candidate_data.get('location')
            else:
                app_dict['candidate_name'] = 'Unknown Candidate'
                app_dict['candidate_email'] = ''
                app_dict['candidate_phone'] = None
                app_dict['candidate_location'] = None

            applications.append(app_dict)

        # Get unique jobs for filter dropdown
        jobs_list = [{'id': job['id'], 'title': job['title']} for job in employer_jobs]

        result = {
            'applications': applications,
            'count': len(applications),
            'jobs': jobs_list
        }

        return format_success_response(result)

    except Exception as e:
        logger.error(f"Get employer applications error: {e}")
        return format_error_response("Failed to retrieve applications", 500)


@matching_bp.route('/job/<job_id>/applications', methods=['GET'])
@jwt_required()
@role_required('employer', 'admin')
def get_job_applications(job_id):
    """Get all applications for a job"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        # Get job
        job_doc = db.jobs.find_one({'id': job_id})
        if not job_doc:
            return format_error_response("Job not found", 404)

        job = Job.from_mongo(job_doc)

        # Check ownership
        if role != 'admin' and job.employer_id != current_user_id:
            return format_error_response("Access denied", 403)

        # Get query parameters
        status = request.args.get('status')

        # Build query
        query_filter = {'job_id': job_id}

        if status:
            query_filter['status'] = status

        # Order by matching score
        application_docs = list(db.applications.find(query_filter).sort('matching_score', -1))

        applications = []
        for app_doc in application_docs:
            app = Application.from_mongo(app_doc)

            # Fetch candidate data
            candidate_data = None
            if app.candidate_id:
                candidate_doc = db.users.find_one({'id': app.candidate_id})
                if candidate_doc:
                    candidate = User.from_mongo(candidate_doc)
                    candidate_data = {
                        'id': candidate.id,
                        'first_name': candidate.first_name,
                        'last_name': candidate.last_name,
                        'email': candidate.email,
                        'phone': candidate.phone,
                        'location': candidate.location
                    }

            app_dict = app.to_dict(include_candidate=True, candidate_data=candidate_data)

            # Add flat candidate fields for frontend compatibility
            if candidate_data:
                app_dict['candidate_name'] = f"{candidate_data.get('first_name', '')} {candidate_data.get('last_name', '')}".strip() or 'Unknown Candidate'
                app_dict['candidate_email'] = candidate_data.get('email', '')
                app_dict['candidate_phone'] = candidate_data.get('phone')
                app_dict['candidate_location'] = candidate_data.get('location')
            else:
                app_dict['candidate_name'] = 'Unknown Candidate'
                app_dict['candidate_email'] = ''
                app_dict['candidate_phone'] = None
                app_dict['candidate_location'] = None

            applications.append(app_dict)

        result = {
            'job': job.to_dict(),
            'applications': applications,
            'count': len(applications)
        }

        return format_success_response(result)

    except Exception as e:
        logger.error(f"Get job applications error: {e}")
        return format_error_response("Failed to retrieve applications", 500)


@matching_bp.route('/application/<application_id>/withdraw', methods=['POST'])
@jwt_required()
@role_required('candidate')
def withdraw_application(application_id):
    """Allow a candidate to withdraw their own application"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        app_doc = db.applications.find_one({'id': application_id})
        if not app_doc:
            return format_error_response("Application not found", 404)

        if app_doc.get('candidate_id') != current_user_id:
            return format_error_response("Unauthorized", 403)

        if app_doc.get('status') in ['offered', 'rejected', 'withdrawn']:
            return format_error_response(
                f"Cannot withdraw an application with status: {app_doc.get('status')}", 400
            )

        from datetime import datetime, timezone
        db.applications.update_one(
            {'id': application_id},
            {'$set': {'status': 'withdrawn', 'updated_at': datetime.now(timezone.utc).isoformat()}}
        )

        return format_success_response({'message': 'Application withdrawn successfully'})

    except Exception as e:
        logger.error(f"Withdraw application error: {e}")
        return format_error_response("Failed to withdraw application", 500)


@matching_bp.route('/application/<application_id>', methods=['PUT'])
@jwt_required()
@role_required('employer', 'admin')
def update_application_status(application_id):
    """Update application status"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        application_doc = db.applications.find_one({'id': application_id})
        if not application_doc:
            return format_error_response("Application not found", 404)

        application = Application.from_mongo(application_doc)

        # Check ownership
        job_doc = db.jobs.find_one({'id': application.job_id})
        job = Job.from_mongo(job_doc)
        if role != 'admin' and job.employer_id != current_user_id:
            return format_error_response("Access denied", 403)

        data = request.get_json()
        update_fields = {}

        # Update status
        if 'status' in data:
            valid_statuses = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn']
            if data['status'] not in valid_statuses:
                return format_error_response(f"Invalid status. Must be one of: {', '.join(valid_statuses)}", 400)

            application.update_status(data['status'])
            update_fields['status'] = data['status']
            update_fields['updated_at'] = datetime.utcnow()

        # Update other fields
        if 'employer_notes' in data:
            application.employer_notes = data['employer_notes']
            update_fields['employer_notes'] = data['employer_notes']

        if 'rating' in data:
            if not 1 <= data['rating'] <= 5:
                return format_error_response("Rating must be between 1 and 5", 400)
            application.rating = data['rating']
            update_fields['rating'] = data['rating']

        if 'interview_scheduled' in data:
            application.interview_scheduled = data['interview_scheduled']
            update_fields['interview_scheduled'] = data['interview_scheduled']

        # Update in MongoDB
        if update_fields:
            db.applications.update_one(
                {'id': application_id},
                {'$set': update_fields}
            )

        logger.info(f"Application updated: {application_id}")

        # Send notification to candidate if status changed
        if 'status' in data:
            try:
                from models import Notification

                # Get candidate info
                candidate_doc = db.users.find_one({'id': application.candidate_id})
                candidate_email = candidate_doc.get('email') if candidate_doc else None

                # Get employer/company info
                employer_doc = db.users.find_one({'id': job.employer_id})
                company_name = None
                if employer_doc:
                    company_name = employer_doc.get('company_name') or employer_doc.get('email', '').split('@')[0].replace('.', ' ').title()

                # Create in-app notification
                notification = Notification.create_status_notification(
                    user_id=application.candidate_id,
                    application_id=application.id,
                    job_id=application.job_id,
                    job_title=job.title,
                    new_status=data['status'],
                    company_name=company_name
                )
                db.notifications.insert_one(notification.to_mongo())

                # Send email notification via Celery
                if candidate_email:
                    from tasks.notification_tasks import send_status_update_notification
                    send_status_update_notification.delay(
                        candidate_email=candidate_email,
                        job_title=job.title,
                        new_status=data['status']
                    )

                logger.info(f"Notification sent for application {application_id} status change to {data['status']}")

            except Exception as notify_error:
                logger.error(f"Error sending notification: {notify_error}")
                # Don't fail the request if notification fails

        return format_success_response(
            application.to_dict(include_candidate=True),
            "Application updated successfully"
        )

    except Exception as e:
        logger.error(f"Update application error: {e}")
        return format_error_response("Failed to update application", 500)


@matching_bp.route('/score', methods=['POST'])
@jwt_required()
def get_matching_score():
    """Get detailed matching score between resume and job"""
    try:
        db = get_db()
        data = request.get_json()

        if 'job_id' not in data:
            return format_error_response("job_id is required", 400)

        current_user_id = get_jwt_identity()

        # Get job
        job_doc = db.jobs.find_one({'id': data['job_id']})
        if not job_doc:
            return format_error_response("Job not found", 404)

        job = Job.from_mongo(job_doc)

        # Get candidate's resume
        resume = db.resumes.find_one(
            {'user_id': current_user_id},
            sort=[('created_at', -1)]
        )

        if not resume:
            return format_error_response("No resume found", 404)

        # Calculate detailed match
        resume_data = {
            'skills': resume['parsed_data'].get('skills', []),
            'experience_years': len(resume['parsed_data'].get('experience', [])),
            'location': resume['parsed_data'].get('personal_info', {}).get('location', '')
        }

        job_payload = {
            'required_skills': job.required_skills or [],
            'preferred_skills': job.preferred_skills or [],
            'experience_years': job.experience_years,
            'location': job.location
        }

        match_details = job_matcher._calculate_detailed_match(resume_data, job_payload)

        # Get explanation from Gemini
        explanation = job_matcher.explain_match_with_gemini(
            resume_data=resume['parsed_data'],
            job_data=job.to_dict(),
            match_score=match_details['overall_score']
        )

        return format_success_response({
            'job': job.to_dict(include_employer=True),
            'match_details': match_details,
            'explanation': explanation
        })

    except Exception as e:
        logger.error(f"Get matching score error: {e}")
        return format_error_response("Failed to calculate matching score", 500)
