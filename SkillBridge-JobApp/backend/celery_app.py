from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Celery
celery = Celery(
    'skillbridge',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

# Celery configuration
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

# Celery Beat schedule for periodic tasks
from celery.schedules import crontab

celery.conf.beat_schedule = {
    # Check and close jobs with expired deadlines - runs daily at midnight
    'enforce-job-deadlines': {
        'task': 'tasks.enforce_job_deadlines',
        'schedule': crontab(hour=0, minute=0),  # Daily at 00:00 UTC
    },
    # Send daily job digest - runs daily at 8 AM
    'send-daily-job-digest': {
        'task': 'tasks.send_daily_job_digest',
        'schedule': crontab(hour=8, minute=0),  # Daily at 08:00 UTC
    },
    # Send weekly job digest - runs every Monday at 8 AM
    'send-weekly-job-digest': {
        'task': 'tasks.send_weekly_job_digest',
        'schedule': crontab(hour=8, minute=0, day_of_week=1),  # Monday at 08:00 UTC
    },
    # Save daily dashboard snapshots - runs daily at 1 AM
    'save-daily-dashboard-snapshots': {
        'task': 'tasks.save_daily_dashboard_snapshots',
        'schedule': crontab(hour=1, minute=0),  # Daily at 01:00 UTC
    },
}

# Import tasks
from tasks import resume_tasks, job_tasks, notification_tasks, analytics_tasks

if __name__ == '__main__':
    celery.start()
