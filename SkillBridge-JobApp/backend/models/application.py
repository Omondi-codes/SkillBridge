from datetime import datetime
import uuid


class Application:
    """Application model for MongoDB"""
    collection_name = 'applications'

    def __init__(self, data=None):
        """Initialize application from dictionary"""
        if data is None:
            data = {}

        self._id = data.get('_id')
        self.id = data.get('id', str(uuid.uuid4()))
        self.job_id = data.get('job_id')
        self.candidate_id = data.get('candidate_id')

        # Resume reference
        self.resume_id = data.get('resume_id')
        self.resume_vector_id = data.get('resume_vector_id')

        # Matching information
        self.matching_score = data.get('matching_score')
        self.skill_match_percentage = data.get('skill_match_percentage')
        self.experience_match = data.get('experience_match')
        self.location_match = data.get('location_match')

        # Match details
        self.match_details = data.get('match_details', {})

        # Application details
        self.cover_letter = data.get('cover_letter')
        self.custom_responses = data.get('custom_responses', {})

        # Status tracking
        self.status = data.get('status', 'pending')

        # Employer actions
        self.employer_notes = data.get('employer_notes')
        self.rating = data.get('rating')

        # Communication
        self.last_contact_date = data.get('last_contact_date')
        self.interview_scheduled = data.get('interview_scheduled')

        # Timestamps
        self.applied_at = data.get('applied_at', datetime.utcnow())
        self.reviewed_at = data.get('reviewed_at')
        self.updated_at = data.get('updated_at', datetime.utcnow())

    def to_dict(self, include_candidate=False, include_job=False, candidate_data=None, job_data=None):
        """Convert application to dictionary"""
        data = {
            'id': self.id,
            'job_id': self.job_id,
            'candidate_id': self.candidate_id,
            'resume_id': self.resume_id,
            'matching_score': self.matching_score,
            'skill_match_percentage': self.skill_match_percentage,
            'experience_match': self.experience_match,
            'location_match': self.location_match,
            'match_details': self.match_details,
            'cover_letter': self.cover_letter,
            'status': self.status,
            'employer_notes': self.employer_notes,
            'rating': self.rating,
            'applied_at': self.applied_at.isoformat() if isinstance(self.applied_at, datetime) else self.applied_at,
            'reviewed_at': self.reviewed_at.isoformat() if isinstance(self.reviewed_at, datetime) else self.reviewed_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
            'interview_scheduled': self.interview_scheduled.isoformat() if isinstance(self.interview_scheduled, datetime) else self.interview_scheduled
        }

        if include_candidate and candidate_data:
            data['candidate'] = candidate_data

        if include_job and job_data:
            data['job'] = job_data

        return data

    def to_mongo(self):
        """Convert to MongoDB document"""
        doc = {
            'id': self.id,
            'job_id': self.job_id,
            'candidate_id': self.candidate_id,
            'resume_id': self.resume_id,
            'resume_vector_id': self.resume_vector_id,
            'matching_score': self.matching_score,
            'skill_match_percentage': self.skill_match_percentage,
            'experience_match': self.experience_match,
            'location_match': self.location_match,
            'match_details': self.match_details,
            'cover_letter': self.cover_letter,
            'custom_responses': self.custom_responses,
            'status': self.status,
            'employer_notes': self.employer_notes,
            'rating': self.rating,
            'last_contact_date': self.last_contact_date,
            'interview_scheduled': self.interview_scheduled,
            'applied_at': self.applied_at,
            'reviewed_at': self.reviewed_at,
            'updated_at': self.updated_at
        }

        if self._id:
            doc['_id'] = self._id

        return doc

    @staticmethod
    def from_mongo(doc):
        """Create Application instance from MongoDB document"""
        if doc is None:
            return None
        return Application(doc)

    def update_status(self, new_status):
        """Update application status"""
        self.status = new_status
        if new_status == 'reviewed':
            self.reviewed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def __repr__(self):
        return f'<Application {self.id} - Job: {self.job_id}>'
