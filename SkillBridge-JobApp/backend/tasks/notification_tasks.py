from celery_app import celery
from pymongo import MongoClient
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# MongoDB connection for Celery tasks
mongo_client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
mongo_db = mongo_client['skillbridge']

def get_db():
    """Get database for tasks"""
    return mongo_db


@celery.task(name='tasks.send_email_notification')
def send_email_notification(to_email: str, subject: str, body: str):
    """Send email notification via SMTP."""
    mail_username = os.getenv('MAIL_USERNAME', '')
    mail_password = os.getenv('MAIL_PASSWORD', '')
    mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    mail_port = int(os.getenv('MAIL_PORT', 587))

    if not mail_username or not mail_password:
        logger.warning(f"Email not configured — skipping send to {to_email}: {subject}")
        return {'success': False, 'error': 'Email credentials not configured'}

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = mail_username
        msg['To'] = to_email
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(mail_server, mail_port) as server:
            server.ehlo()
            server.starttls()
            server.login(mail_username, mail_password)
            server.sendmail(mail_username, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email}: {subject}")
        return {'success': True, 'to': to_email, 'subject': subject}

    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.send_application_notification')
def send_application_notification(employer_email: str, job_title: str, candidate_name: str):
    """
    Notify employer of new application
    """
    try:
        subject = f"New Application for {job_title}"
        body = f"""
        Dear Employer,

        You have received a new application for the position of {job_title}.

        Candidate: {candidate_name}

        Please log in to your dashboard to review the application.

        Best regards,
        SkillBridge Team
        """

        return send_email_notification(employer_email, subject, body)

    except Exception as e:
        logger.error(f"Error sending application notification: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.send_status_update_notification')
def send_status_update_notification(candidate_email: str, job_title: str, new_status: str):
    """
    Notify candidate of application status update
    """
    try:
        subject = f"Application Status Update: {job_title}"
        body = f"""
        Dear Candidate,

        Your application for {job_title} has been updated.

        New Status: {new_status.title()}

        Please log in to your dashboard for more details.

        Best regards,
        SkillBridge Team
        """

        return send_email_notification(candidate_email, subject, body)

    except Exception as e:
        logger.error(f"Error sending status update notification: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.send_job_alert_notification')
def send_job_alert_notification(user_id: str, job_id: str):
    """
    Notify user of a new job matching their alert
    """
    try:
        from models import User, Job

        db = get_db()

        # Get user and job details
        user_doc = db.users.find_one({'id': user_id})
        job_doc = db.jobs.find_one({'id': job_id})

        if not user_doc or not job_doc:
            return {'success': False, 'error': 'User or job not found'}

        user = User.from_mongo(user_doc)
        job = Job.from_mongo(job_doc)

        # Get employer info
        employer_doc = db.users.find_one({'id': job.employer_id})
        company_name = 'Unknown Company'
        if employer_doc:
            employer = User.from_mongo(employer_doc)
            company_name = employer.company_name or employer.email.split('@')[0]

        subject = f"New Job Alert: {job.title} at {company_name}"
        body = f"""
        Dear {user.first_name or 'Candidate'},

        A new job matching your alert has been posted!

        Job Title: {job.title}
        Company: {company_name}
        Location: {job.location}
        Employment Type: {job.employment_type}

        {job.description[:200]}...

        View full details and apply: [Application URL]

        Best regards,
        SkillBridge Team
        """

        return send_email_notification(user.email, subject, body)

    except Exception as e:
        logger.error(f"Error sending job alert notification: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.send_deadline_notification')
def send_deadline_notification(employer_id: str, job_id: str):
    """
    Notify employer that their job has been closed due to deadline
    """
    try:
        from models import User, Job

        db = get_db()

        # Get employer and job details
        employer_doc = db.users.find_one({'id': employer_id})
        job_doc = db.jobs.find_one({'id': job_id})

        if not employer_doc or not job_doc:
            return {'success': False, 'error': 'Employer or job not found'}

        employer = User.from_mongo(employer_doc)
        job = Job.from_mongo(job_doc)

        # Get application count
        app_count = db.applications.count_documents({'job_id': job_id})

        subject = f"Job Posting Closed: {job.title}"
        body = f"""
        Dear {employer.company_name or 'Employer'},

        Your job posting "{job.title}" has been automatically closed because the application deadline has passed.

        Posted on: {job.posted_at.strftime('%Y-%m-%d') if job.posted_at else 'N/A'}
        Application Deadline: {job.application_deadline.strftime('%Y-%m-%d') if job.application_deadline else 'N/A'}
        Total Applications: {app_count}

        You can view all applications in your employer dashboard.

        To repost this job, please create a new listing with an updated deadline.

        Best regards,
        SkillBridge Team
        """

        return send_email_notification(employer.email, subject, body)

    except Exception as e:
        logger.error(f"Error sending deadline notification: {e}")
        return {'success': False, 'error': str(e)}


@celery.task(name='tasks.send_job_digest_email')
def send_job_digest_email(user_id: str, matching_jobs: list):
    """
    Send digest email with multiple matching jobs
    """
    try:
        from models import User

        db = get_db()

        # Get user details
        user_doc = db.users.find_one({'id': user_id})
        if not user_doc:
            return {'success': False, 'error': 'User not found'}

        user = User.from_mongo(user_doc)

        # Build job list
        job_list = "\n\n".join([
            f"""
            {i+1}. {job.get('title', 'Unknown Position')}
               Company: {job.get('company_name', 'Unknown Company')}
               Location: {job.get('location', 'Not specified')}
               Type: {job.get('employment_type', 'Full-time')}
            """
            for i, job in enumerate(matching_jobs[:10])  # Limit to 10 jobs
        ])

        subject = f"Job Digest: {len(matching_jobs)} New Matching Jobs"
        body = f"""
        Dear {user.first_name or 'Candidate'},

        We found {len(matching_jobs)} new job(s) matching your alert criteria:

        {job_list}

        View all jobs and apply: [Dashboard URL]

        Best regards,
        SkillBridge Team
        """

        return send_email_notification(user.email, subject, body)

    except Exception as e:
        logger.error(f"Error sending job digest email: {e}")
        return {'success': False, 'error': str(e)}
