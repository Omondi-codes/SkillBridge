from celery_app import celery
from models import db
from models.dashboard_snapshot import DashboardSnapshot
from models.user import User
from models.job import Job
from models.application import Application
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@celery.task(name='tasks.save_daily_dashboard_snapshots')
def save_daily_dashboard_snapshots():
    """
    Periodic task to save daily dashboard snapshots for all employers.
    This runs daily at midnight to capture historical data for trend calculation.
    """
    try:
        logger.info("Starting daily dashboard snapshot task")

        # Get all employer users
        employers = list(db.users.find({'role': 'employer'}))

        snapshots_saved = 0
        for employer in employers:
            try:
                employer_id = str(employer['_id'])

                # Get employer's jobs
                jobs = list(db.jobs.find({'employer_id': employer_id}))
                job_ids = [str(job['_id']) for job in jobs]

                # Calculate stats
                active_jobs = len([job for job in jobs if job.get('status') == 'active'])
                filled_positions = len([job for job in jobs if job.get('status') == 'filled'])

                # Get all applications for employer's jobs
                applications = list(db.applications.find({'job_id': {'$in': job_ids}}))
                total_applications = len(applications)
                shortlisted = len([app for app in applications if app.get('status') == 'shortlisted'])

                # Create snapshot
                snapshot_data = {
                    'employer_id': employer_id,
                    'active_jobs': active_jobs,
                    'total_applications': total_applications,
                    'shortlisted': shortlisted,
                    'filled_positions': filled_positions,
                    'snapshot_date': datetime.utcnow()
                }

                # Save snapshot
                DashboardSnapshot.create(snapshot_data)
                snapshots_saved += 1

                logger.info(f"Saved snapshot for employer {employer_id}: {snapshot_data}")

            except Exception as e:
                logger.error(f"Error saving snapshot for employer {employer.get('_id')}: {e}")
                continue

        logger.info(f"Daily dashboard snapshot task completed. Saved {snapshots_saved} snapshots for {len(employers)} employers")

        return {
            'success': True,
            'total_employers': len(employers),
            'snapshots_saved': snapshots_saved
        }

    except Exception as e:
        logger.error(f"Error in daily dashboard snapshot task: {e}")
        return {
            'success': False,
            'error': str(e)
        }
