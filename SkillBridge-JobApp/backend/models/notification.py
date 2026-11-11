from datetime import datetime
import uuid


class Notification:
    """Notification model for MongoDB"""
    collection_name = 'notifications'

    # Notification types
    TYPE_APPLICATION_STATUS = 'application_status'
    TYPE_NEW_APPLICATION = 'new_application'
    TYPE_JOB_ALERT = 'job_alert'
    TYPE_INTERVIEW_SCHEDULED = 'interview_scheduled'
    TYPE_MESSAGE = 'message'
    TYPE_SYSTEM = 'system'

    def __init__(self, data=None):
        """Initialize notification from dictionary"""
        if data is None:
            data = {}

        self._id = data.get('_id')
        self.id = data.get('id', str(uuid.uuid4()))
        self.user_id = data.get('user_id')  # Recipient user ID

        # Notification content
        self.type = data.get('type', self.TYPE_SYSTEM)
        self.title = data.get('title')
        self.message = data.get('message')

        # Related entities
        self.application_id = data.get('application_id')
        self.job_id = data.get('job_id')
        self.from_user_id = data.get('from_user_id')  # Sender (e.g., employer)

        # Additional data for frontend
        self.metadata = data.get('metadata', {})

        # Status
        self.is_read = data.get('is_read', False)
        self.read_at = data.get('read_at')

        # Email status
        self.email_sent = data.get('email_sent', False)
        self.email_sent_at = data.get('email_sent_at')

        # Timestamps
        self.created_at = data.get('created_at', datetime.utcnow())

    def to_dict(self):
        """Convert notification to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'application_id': self.application_id,
            'job_id': self.job_id,
            'from_user_id': self.from_user_id,
            'metadata': self.metadata,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if isinstance(self.read_at, datetime) else self.read_at,
            'email_sent': self.email_sent,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

    def to_mongo(self):
        """Convert to MongoDB document"""
        doc = {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'application_id': self.application_id,
            'job_id': self.job_id,
            'from_user_id': self.from_user_id,
            'metadata': self.metadata,
            'is_read': self.is_read,
            'read_at': self.read_at,
            'email_sent': self.email_sent,
            'email_sent_at': self.email_sent_at,
            'created_at': self.created_at
        }

        if self._id:
            doc['_id'] = self._id

        return doc

    @staticmethod
    def from_mongo(doc):
        """Create Notification instance from MongoDB document"""
        if doc is None:
            return None
        return Notification(doc)

    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.read_at = datetime.utcnow()

    @staticmethod
    def create_status_notification(user_id, application_id, job_id, job_title, new_status, company_name=None):
        """Factory method to create application status notification"""
        status_messages = {
            'reviewed': f'Your application for {job_title} has been reviewed',
            'shortlisted': f'Congratulations! You\'ve been shortlisted for {job_title}',
            'interviewed': f'You\'ve been scheduled for an interview for {job_title}',
            'offered': f'Great news! You\'ve received an offer for {job_title}',
            'rejected': f'Your application for {job_title} was not selected',
            'pending': f'Your application for {job_title} is pending review'
        }

        status_titles = {
            'reviewed': 'Application Reviewed',
            'shortlisted': 'You\'re Shortlisted!',
            'interviewed': 'Interview Scheduled',
            'offered': 'Job Offer Received!',
            'rejected': 'Application Update',
            'pending': 'Application Received'
        }

        return Notification({
            'user_id': user_id,
            'type': Notification.TYPE_APPLICATION_STATUS,
            'title': status_titles.get(new_status, 'Application Update'),
            'message': status_messages.get(new_status, f'Your application status has been updated to: {new_status}'),
            'application_id': application_id,
            'job_id': job_id,
            'metadata': {
                'status': new_status,
                'job_title': job_title,
                'company_name': company_name
            }
        })

    def __repr__(self):
        return f'<Notification {self.id} - {self.type}>'
