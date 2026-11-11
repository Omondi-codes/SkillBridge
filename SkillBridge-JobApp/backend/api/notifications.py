from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Notification
from utils.helpers import format_error_response, format_success_response
from datetime import datetime
import logging

notifications_bp = Blueprint('notifications', __name__)
logger = logging.getLogger(__name__)


def get_db():
    """Get MongoDB database instance from current Flask app"""
    return current_app.mongo_db


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for current user"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Get query parameters
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Build query
        query_filter = {'user_id': current_user_id}

        if unread_only:
            query_filter['is_read'] = False

        # Get total count
        total = db.notifications.count_documents(query_filter)
        unread_count = db.notifications.count_documents({
            'user_id': current_user_id,
            'is_read': False
        })

        # Get notifications with pagination
        notification_docs = list(
            db.notifications.find(query_filter)
            .sort('created_at', -1)
            .skip(offset)
            .limit(limit)
        )

        notifications = [Notification.from_mongo(doc).to_dict() for doc in notification_docs]

        return format_success_response({
            'notifications': notifications,
            'total': total,
            'unread_count': unread_count,
            'limit': limit,
            'offset': offset
        })

    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        return format_error_response("Failed to retrieve notifications", 500)


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        unread_count = db.notifications.count_documents({
            'user_id': current_user_id,
            'is_read': False
        })

        return format_success_response({'unread_count': unread_count})

    except Exception as e:
        logger.error(f"Get unread count error: {e}")
        return format_error_response("Failed to get unread count", 500)


@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Find notification
        notification_doc = db.notifications.find_one({
            'id': notification_id,
            'user_id': current_user_id
        })

        if not notification_doc:
            return format_error_response("Notification not found", 404)

        # Update as read
        db.notifications.update_one(
            {'id': notification_id},
            {'$set': {
                'is_read': True,
                'read_at': datetime.utcnow()
            }}
        )

        return format_success_response(None, "Notification marked as read")

    except Exception as e:
        logger.error(f"Mark as read error: {e}")
        return format_error_response("Failed to mark notification as read", 500)


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Update all unread notifications
        result = db.notifications.update_many(
            {'user_id': current_user_id, 'is_read': False},
            {'$set': {
                'is_read': True,
                'read_at': datetime.utcnow()
            }}
        )

        return format_success_response({
            'marked_count': result.modified_count
        }, f"Marked {result.modified_count} notifications as read")

    except Exception as e:
        logger.error(f"Mark all as read error: {e}")
        return format_error_response("Failed to mark notifications as read", 500)


@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        # Find and delete notification
        result = db.notifications.delete_one({
            'id': notification_id,
            'user_id': current_user_id
        })

        if result.deleted_count == 0:
            return format_error_response("Notification not found", 404)

        return format_success_response(None, "Notification deleted")

    except Exception as e:
        logger.error(f"Delete notification error: {e}")
        return format_error_response("Failed to delete notification", 500)


@notifications_bp.route('/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    """Clear all notifications for current user"""
    try:
        db = get_db()
        current_user_id = get_jwt_identity()

        result = db.notifications.delete_many({'user_id': current_user_id})

        return format_success_response({
            'deleted_count': result.deleted_count
        }, f"Deleted {result.deleted_count} notifications")

    except Exception as e:
        logger.error(f"Clear all notifications error: {e}")
        return format_error_response("Failed to clear notifications", 500)
