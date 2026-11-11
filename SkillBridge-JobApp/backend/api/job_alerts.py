from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import JobAlert
from utils.helpers import format_error_response, format_success_response
from utils.decorators import role_required
from datetime import datetime
import logging

def get_db():
    """Get database from Flask app context"""
    return current_app.mongo_db

logger = logging.getLogger(__name__)

job_alerts_bp = Blueprint('job_alerts', __name__)


@job_alerts_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('candidate')
def create_job_alert():
    """Create a new job alert"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data.get('keywords') and not data.get('category') and not data.get('location'):
            return format_error_response(
                "At least one filter (keywords, category, or location) is required",
                400
            )

        # Create job alert
        job_alert = JobAlert(
            user_id=current_user_id,
            keywords=data.get('keywords', []),
            location=data.get('location'),
            category=data.get('category'),
            employment_type=data.get('employment_type'),
            experience_level=data.get('experience_level'),
            min_salary=data.get('min_salary'),
            remote_only=data.get('remote_only', False),
            frequency=data.get('frequency', 'instant')
        )

        # Save to database
        db.job_alerts.insert_one(job_alert.to_mongo())

        logger.info(f"Job alert created: {job_alert.id} for user: {current_user_id}")

        return format_success_response(
            job_alert.to_dict(),
            "Job alert created successfully",
            201
        )

    except Exception as e:
        logger.error(f"Create job alert error: {e}")
        return format_error_response("Failed to create job alert", 500)


@job_alerts_bp.route('/', methods=['GET'])
@jwt_required()
@role_required('candidate')
def get_job_alerts():
    """Get all job alerts for current user"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get all alerts for user
        alert_docs = list(db.job_alerts.find({'user_id': current_user_id}).sort('created_at', -1))

        alerts = [JobAlert.from_mongo(doc).to_dict() for doc in alert_docs]

        return format_success_response({
            'alerts': alerts,
            'count': len(alerts)
        })

    except Exception as e:
        logger.error(f"Get job alerts error: {e}")
        return format_error_response("Failed to retrieve job alerts", 500)


@job_alerts_bp.route('/<alert_id>', methods=['GET'])
@jwt_required()
@role_required('candidate')
def get_job_alert(alert_id):
    """Get a specific job alert"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        alert_doc = db.job_alerts.find_one({'id': alert_id, 'user_id': current_user_id})

        if not alert_doc:
            return format_error_response("Job alert not found", 404)

        alert = JobAlert.from_mongo(alert_doc)

        return format_success_response(alert.to_dict())

    except Exception as e:
        logger.error(f"Get job alert error: {e}")
        return format_error_response("Failed to retrieve job alert", 500)


@job_alerts_bp.route('/<alert_id>', methods=['PUT'])
@jwt_required()
@role_required('candidate')
def update_job_alert(alert_id):
    """Update a job alert"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Check if alert exists and belongs to user
        alert_doc = db.job_alerts.find_one({'id': alert_id, 'user_id': current_user_id})

        if not alert_doc:
            return format_error_response("Job alert not found", 404)

        # Update fields
        update_data = {
            'updated_at': datetime.utcnow()
        }

        if 'keywords' in data:
            update_data['keywords'] = data['keywords']
        if 'location' in data:
            update_data['location'] = data['location']
        if 'category' in data:
            update_data['category'] = data['category']
        if 'employment_type' in data:
            update_data['employment_type'] = data['employment_type']
        if 'experience_level' in data:
            update_data['experience_level'] = data['experience_level']
        if 'min_salary' in data:
            update_data['min_salary'] = data['min_salary']
        if 'remote_only' in data:
            update_data['remote_only'] = data['remote_only']
        if 'frequency' in data:
            update_data['frequency'] = data['frequency']
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']

        # Update in database
        db.job_alerts.update_one(
            {'id': alert_id},
            {'$set': update_data}
        )

        # Get updated alert
        updated_doc = db.job_alerts.find_one({'id': alert_id})
        alert = JobAlert.from_mongo(updated_doc)

        logger.info(f"Job alert updated: {alert_id}")

        return format_success_response(
            alert.to_dict(),
            "Job alert updated successfully"
        )

    except Exception as e:
        logger.error(f"Update job alert error: {e}")
        return format_error_response("Failed to update job alert", 500)


@job_alerts_bp.route('/<alert_id>', methods=['DELETE'])
@jwt_required()
@role_required('candidate')
def delete_job_alert(alert_id):
    """Delete a job alert"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Check if alert exists and belongs to user
        alert_doc = db.job_alerts.find_one({'id': alert_id, 'user_id': current_user_id})

        if not alert_doc:
            return format_error_response("Job alert not found", 404)

        # Delete alert
        db.job_alerts.delete_one({'id': alert_id})

        logger.info(f"Job alert deleted: {alert_id}")

        return format_success_response(
            None,
            "Job alert deleted successfully"
        )

    except Exception as e:
        logger.error(f"Delete job alert error: {e}")
        return format_error_response("Failed to delete job alert", 500)


@job_alerts_bp.route('/<alert_id>/toggle', methods=['POST'])
@jwt_required()
@role_required('candidate')
def toggle_job_alert(alert_id):
    """Toggle job alert active status"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Check if alert exists and belongs to user
        alert_doc = db.job_alerts.find_one({'id': alert_id, 'user_id': current_user_id})

        if not alert_doc:
            return format_error_response("Job alert not found", 404)

        # Toggle is_active
        new_status = not alert_doc.get('is_active', True)

        db.job_alerts.update_one(
            {'id': alert_id},
            {
                '$set': {
                    'is_active': new_status,
                    'updated_at': datetime.utcnow()
                }
            }
        )

        logger.info(f"Job alert toggled: {alert_id} - active: {new_status}")

        return format_success_response(
            {'is_active': new_status},
            f"Job alert {'activated' if new_status else 'deactivated'} successfully"
        )

    except Exception as e:
        logger.error(f"Toggle job alert error: {e}")
        return format_error_response("Failed to toggle job alert", 500)
