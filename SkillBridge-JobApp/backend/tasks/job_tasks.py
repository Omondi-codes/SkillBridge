from celery_app import celery
from services.job_matcher import JobMatcher
from services.vector_service import VectorService
from models import Job, JobAlert, User
from pymongo import MongoClient
from datetime import datetime, timedelta
import os
import logging

logger = logging.getLogger(__name__)

vector_service = VectorService()
job_matcher = JobMatcher(vector_service)

# MongoDB connection for Celery tasks
mongo_client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
mongo_db = mongo_client['skillbridge']

def get_db():
    """Get database for tasks"""
    return mongo_db


@celery.task(name='tasks.generate_job_matches')
def generate_job_matches(job_id: str, limit: int = 50):
    """
    Generate candidate matches for a newly posted job
    """
    try:
        logger.info(f"Generating matches for job: {job_id}")

        # Get job
        job = Job.query.get(job_id)
        if not job:
            return {'success': False, 'error': 'Job not found'}

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

        # Find matching candidates
        matches = job_matcher.match_candidates_for_job(
            job_data=job_data,
            job_embedding=job_embedding,
            limit=limit
        )

        logger.info(f"Found {len(matches)} matches for job: {job_id}")

        return {
            'success': True,
            'job_id': job_id,
            'matches_count': len(matches)
        }

    except Exception as e:
        logger.error(f"Error generating job matches: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.update_job_vector')
def update_job_vector(job_id: str):
    """
    Update job vector in Qdrant
    """
    try:
        logger.info(f"Updating job vector: {job_id}")

        # Get job
        job = Job.query.get(job_id)
        if not job:
            return {'success': False, 'error': 'Job not found'}

        # Regenerate embedding
        job_data = {
            'title': job.title,
            'description': job.description,
            'required_skills': job.required_skills or [],
            'preferred_skills': job.preferred_skills or [],
            'experience_years': job.experience_years,
            'location': job.location
        }
        new_embedding = job_matcher.generate_job_embedding(job_data)

        # Update metadata
        from models import User
        employer = User.query.get(job.employer_id)

        metadata = {
            'job_id': job_id,
            'required_skills': job.required_skills or [],
            'preferred_skills': job.preferred_skills or [],
            'experience_years': job.experience_years,
            'location': job.location,
            'employment_type': job.employment_type or '',
            'salary_min': job.salary_min or 0,
            'salary_max': job.salary_max or 0,
            'category': job.category or '',
            'company': employer.company_name if employer else ''
        }

        # Store updated vector
        vector_service.store_job_vector(
            job_id=job_id,
            embedding=new_embedding,
            metadata=metadata
        )

        logger.info(f"Job vector updated: {job_id}")

        return {'success': True, 'job_id': job_id}

    except Exception as e:
        logger.error(f"Error updating job vector: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.check_job_alerts')
def check_job_alerts(job_id: str):
    """
    Check all active job alerts and notify users if job matches their criteria
    Triggered when a new job is posted
    """
    try:
        logger.info(f"Checking job alerts for new job: {job_id}")
        db = get_db()

        # Get the job
        job_doc = db.jobs.find_one({'id': job_id})
        if not job_doc:
            return {'success': False, 'error': 'Job not found'}

        job = Job.from_mongo(job_doc)

        # Get all active job alerts
        alert_docs = list(db.job_alerts.find({'is_active': True}))
        matched_alerts = []

        for alert_doc in alert_docs:
            alert = JobAlert.from_mongo(alert_doc)

            # Check if job matches alert criteria
            if alert.matches_job(job):
                matched_alerts.append(alert)

                # Trigger notification task
                from tasks.notification_tasks import send_job_alert_notification
                send_job_alert_notification.delay(alert.user_id, job_id)

        logger.info(f"Job {job_id} matched {len(matched_alerts)} alerts")

        return {
            'success': True,
            'job_id': job_id,
            'matched_alerts': len(matched_alerts)
        }

    except Exception as e:
        logger.error(f"Error checking job alerts: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.enforce_job_deadlines')
def enforce_job_deadlines():
    """
    Scheduled task to check and close jobs that have passed their application deadline
    Should be run daily via Celery Beat
    """
    try:
        logger.info("Enforcing job application deadlines")
        db = get_db()

        # Find active jobs with expired deadlines
        now = datetime.utcnow()
        expired_jobs = db.jobs.find({
            'status': 'active',
            'application_deadline': {'$lt': now}
        })

        closed_count = 0
        for job_doc in expired_jobs:
            job_id = job_doc['id']

            # Update job status to closed
            db.jobs.update_one(
                {'id': job_id},
                {
                    '$set': {
                        'status': 'closed',
                        'updated_at': now
                    }
                }
            )

            logger.info(f"Closed job {job_id} due to expired deadline")
            closed_count += 1

            # Optionally notify employer
            from tasks.notification_tasks import send_deadline_notification
            employer_id = job_doc.get('employer_id')
            if employer_id:
                send_deadline_notification.delay(employer_id, job_id)

        logger.info(f"Closed {closed_count} jobs due to expired deadlines")

        return {
            'success': True,
            'closed_jobs': closed_count
        }

    except Exception as e:
        logger.error(f"Error enforcing job deadlines: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.send_daily_job_digest')
def send_daily_job_digest():
    """
    Send daily digest of matching jobs to users with 'daily' alert frequency
    Should be run once daily via Celery Beat
    """
    try:
        logger.info("Sending daily job digest")
        db = get_db()

        # Get alerts with daily frequency
        daily_alerts = list(db.job_alerts.find({
            'is_active': True,
            'frequency': 'daily'
        }))

        # Get jobs posted in last 24 hours
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_jobs = list(db.jobs.find({
            'status': 'active',
            'posted_at': {'$gte': yesterday}
        }))

        digests_sent = 0

        for alert_doc in daily_alerts:
            alert = JobAlert.from_mongo(alert_doc)
            matching_jobs = []

            # Find jobs that match this alert
            for job_doc in recent_jobs:
                job = Job.from_mongo(job_doc)
                if alert.matches_job(job):
                    matching_jobs.append(job.to_dict())

            # Send digest if there are matching jobs
            if matching_jobs:
                from tasks.notification_tasks import send_job_digest_email
                send_job_digest_email.delay(alert.user_id, matching_jobs)
                digests_sent += 1

                # Update last_sent_at
                db.job_alerts.update_one(
                    {'id': alert.id},
                    {'$set': {'last_sent_at': datetime.utcnow()}}
                )

        logger.info(f"Sent {digests_sent} daily job digests")

        return {
            'success': True,
            'digests_sent': digests_sent
        }

    except Exception as e:
        logger.error(f"Error sending daily job digest: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.send_weekly_job_digest')
def send_weekly_job_digest():
    """
    Send weekly digest of matching jobs to users with 'weekly' alert frequency
    Should be run once weekly via Celery Beat
    """
    try:
        logger.info("Sending weekly job digest")
        db = get_db()

        # Get alerts with weekly frequency
        weekly_alerts = list(db.job_alerts.find({
            'is_active': True,
            'frequency': 'weekly'
        }))

        # Get jobs posted in last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_jobs = list(db.jobs.find({
            'status': 'active',
            'posted_at': {'$gte': week_ago}
        }))

        digests_sent = 0

        for alert_doc in weekly_alerts:
            alert = JobAlert.from_mongo(alert_doc)
            matching_jobs = []

            # Find jobs that match this alert
            for job_doc in recent_jobs:
                job = Job.from_mongo(job_doc)
                if alert.matches_job(job):
                    matching_jobs.append(job.to_dict())

            # Send digest if there are matching jobs
            if matching_jobs:
                from tasks.notification_tasks import send_job_digest_email
                send_job_digest_email.delay(alert.user_id, matching_jobs)
                digests_sent += 1

                # Update last_sent_at
                db.job_alerts.update_one(
                    {'id': alert.id},
                    {'$set': {'last_sent_at': datetime.utcnow()}}
                )

        logger.info(f"Sent {digests_sent} weekly job digests")

        return {
            'success': True,
            'digests_sent': digests_sent
        }

    except Exception as e:
        logger.error(f"Error sending weekly job digest: {e}")
        return {'success': False, 'error': str(e)}
