from datetime import datetime
import uuid


class DashboardSnapshot:
    """Dashboard statistics snapshot model for tracking trends over time"""
    collection_name = 'dashboard_snapshots'

    def __init__(self, data=None):
        """Initialize dashboard snapshot from dictionary"""
        if data is None:
            data = {}

        self._id = data.get('_id')
        self.id = data.get('id', str(uuid.uuid4()))
        self.user_id = data.get('user_id')  # Employer ID
        self.user_role = data.get('user_role', 'employer')  # 'employer' or 'candidate'

        # Employer stats
        self.active_jobs = data.get('active_jobs', 0)
        self.total_applications = data.get('total_applications', 0)
        self.shortlisted = data.get('shortlisted', 0)
        self.filled_positions = data.get('filled_positions', 0)

        # Candidate stats (for future use)
        self.applications_submitted = data.get('applications_submitted', 0)
        self.interviews_scheduled = data.get('interviews_scheduled', 0)
        self.profile_views = data.get('profile_views', 0)
        self.job_matches = data.get('job_matches', 0)

        # Timestamp
        self.snapshot_date = data.get('snapshot_date', datetime.utcnow())
        self.created_at = data.get('created_at', datetime.utcnow())

    def to_dict(self):
        """Convert snapshot to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_role': self.user_role,
            'active_jobs': self.active_jobs,
            'total_applications': self.total_applications,
            'shortlisted': self.shortlisted,
            'filled_positions': self.filled_positions,
            'applications_submitted': self.applications_submitted,
            'interviews_scheduled': self.interviews_scheduled,
            'profile_views': self.profile_views,
            'job_matches': self.job_matches,
            'snapshot_date': self.snapshot_date.isoformat() if isinstance(self.snapshot_date, datetime) else self.snapshot_date,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

    def to_mongo(self):
        """Convert to MongoDB document"""
        doc = {
            'id': self.id,
            'user_id': self.user_id,
            'user_role': self.user_role,
            'active_jobs': self.active_jobs,
            'total_applications': self.total_applications,
            'shortlisted': self.shortlisted,
            'filled_positions': self.filled_positions,
            'applications_submitted': self.applications_submitted,
            'interviews_scheduled': self.interviews_scheduled,
            'profile_views': self.profile_views,
            'job_matches': self.job_matches,
            'snapshot_date': self.snapshot_date,
            'created_at': self.created_at
        }

        if self._id:
            doc['_id'] = self._id

        return doc

    @staticmethod
    def from_mongo(doc):
        """Create DashboardSnapshot instance from MongoDB document"""
        if doc is None:
            return None
        return DashboardSnapshot(doc)

    def __repr__(self):
        return f'<DashboardSnapshot {self.id} - User: {self.user_id}>'
