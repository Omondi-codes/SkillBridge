from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import DashboardSnapshot, Job, Application
from utils.helpers import format_error_response, format_success_response
from datetime import datetime, timedelta
import logging

analytics_bp = Blueprint('analytics', __name__)
logger = logging.getLogger(__name__)


def get_db():
    """Get MongoDB database instance from current Flask app"""
    return current_app.mongo_db


@analytics_bp.route('/dashboard/snapshot', methods=['POST'])
@jwt_required()
def create_snapshot():
    """Create a snapshot of current dashboard stats"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        # Calculate current stats
        if role == 'employer':
            # Get employer stats
            jobs = list(db.jobs.find({'employer_id': current_user_id}))
            job_ids = [job['id'] for job in jobs]

            active_jobs = len([j for j in jobs if j.get('status') == 'active'])
            filled_positions = len([j for j in jobs if j.get('status') == 'filled'])

            applications = list(db.applications.find({'job_id': {'$in': job_ids}}))
            total_applications = len(applications)
            shortlisted = len([a for a in applications if a.get('status') == 'shortlisted'])

            snapshot = DashboardSnapshot({
                'user_id': current_user_id,
                'user_role': 'employer',
                'active_jobs': active_jobs,
                'total_applications': total_applications,
                'shortlisted': shortlisted,
                'filled_positions': filled_positions
            })
        else:
            # Candidate stats
            applications = list(db.applications.find({'candidate_id': current_user_id}))

            snapshot = DashboardSnapshot({
                'user_id': current_user_id,
                'user_role': 'candidate',
                'applications_submitted': len(applications),
                'interviews_scheduled': len([a for a in applications if a.get('status') in ['interviewed', 'offered']]),
                'profile_views': 0,  # TODO: Implement profile view tracking
                'job_matches': 0  # TODO: Implement match tracking
            })

        db.dashboard_snapshots.insert_one(snapshot.to_mongo())

        return format_success_response(snapshot.to_dict(), "Snapshot created successfully")

    except Exception as e:
        logger.error(f"Create snapshot error: {e}")
        return format_error_response("Failed to create snapshot", 500)


@analytics_bp.route('/dashboard/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """Get dashboard trends by comparing current vs previous period"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        # Get period from query params (default: 7 days)
        days = int(request.args.get('days', 7))

        # Calculate current stats
        now = datetime.utcnow()
        period_start = now - timedelta(days=days)

        if role == 'employer':
            # Current stats
            jobs = list(db.jobs.find({'employer_id': current_user_id}))
            job_ids = [job['id'] for job in jobs]

            current_stats = {
                'active_jobs': len([j for j in jobs if j.get('status') == 'active']),
                'total_applications': db.applications.count_documents({'job_id': {'$in': job_ids}}),
                'shortlisted': db.applications.count_documents({'job_id': {'$in': job_ids}, 'status': 'shortlisted'}),
                'filled_positions': len([j for j in jobs if j.get('status') == 'filled'])
            }

            # Get snapshot from previous period
            previous_snapshot = db.dashboard_snapshots.find_one({
                'user_id': current_user_id,
                'user_role': 'employer',
                'snapshot_date': {'$lte': period_start}
            }, sort=[('snapshot_date', -1)])

            if previous_snapshot:
                prev_stats = {
                    'active_jobs': previous_snapshot.get('active_jobs', 0),
                    'total_applications': previous_snapshot.get('total_applications', 0),
                    'shortlisted': previous_snapshot.get('shortlisted', 0),
                    'filled_positions': previous_snapshot.get('filled_positions', 0)
                }
            else:
                # No historical data, use zeros
                prev_stats = {
                    'active_jobs': 0,
                    'total_applications': 0,
                    'shortlisted': 0,
                    'filled_positions': 0
                }

            # Calculate trends
            trends = {}
            for key in current_stats.keys():
                current = current_stats[key]
                previous = prev_stats[key]

                if previous == 0:
                    if current > 0:
                        change = current
                        percentage = 100
                    else:
                        change = 0
                        percentage = 0
                else:
                    change = current - previous
                    percentage = round((change / previous) * 100, 1)

                trends[key] = {
                    'current': current,
                    'previous': previous,
                    'change': change,
                    'percentage': percentage,
                    'trend_up': change >= 0
                }

            return format_success_response({
                'role': 'employer',
                'period_days': days,
                'trends': trends,
                'has_historical_data': previous_snapshot is not None
            })

        else:
            # Candidate trends (similar logic)
            applications = list(db.applications.find({'candidate_id': current_user_id}))

            current_stats = {
                'applications': len(applications),
                'interviews': len([a for a in applications if a.get('status') in ['interviewed', 'offered']])
            }

            previous_snapshot = db.dashboard_snapshots.find_one({
                'user_id': current_user_id,
                'user_role': 'candidate',
                'snapshot_date': {'$lte': period_start}
            }, sort=[('snapshot_date', -1)])

            if previous_snapshot:
                prev_stats = {
                    'applications': previous_snapshot.get('applications_submitted', 0),
                    'interviews': previous_snapshot.get('interviews_scheduled', 0)
                }
            else:
                prev_stats = {'applications': 0, 'interviews': 0}

            trends = {}
            for key in current_stats.keys():
                current = current_stats[key]
                previous = prev_stats[key]

                if previous == 0:
                    change = current if current > 0 else 0
                    percentage = 100 if current > 0 else 0
                else:
                    change = current - previous
                    percentage = round((change / previous) * 100, 1)

                trends[key] = {
                    'current': current,
                    'previous': previous,
                    'change': change,
                    'percentage': percentage,
                    'trend_up': change >= 0
                }

            return format_success_response({
                'role': 'candidate',
                'period_days': days,
                'trends': trends,
                'has_historical_data': previous_snapshot is not None
            })

    except Exception as e:
        logger.error(f"Get trends error: {e}")
        return format_error_response("Failed to retrieve trends", 500)


@analytics_bp.route('/dashboard/snapshots', methods=['GET'])
@jwt_required()
def get_snapshots():
    """Get historical snapshots for charts"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        # Get last N days of snapshots
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)

        snapshots = list(db.dashboard_snapshots.find({
            'user_id': current_user_id,
            'user_role': role,
            'snapshot_date': {'$gte': start_date}
        }).sort('snapshot_date', 1))

        snapshot_list = [DashboardSnapshot.from_mongo(s).to_dict() for s in snapshots]

        return format_success_response({
            'snapshots': snapshot_list,
            'count': len(snapshot_list),
            'period_days': days
        })

    except Exception as e:
        logger.error(f"Get snapshots error: {e}")
        return format_error_response("Failed to retrieve snapshots", 500)
