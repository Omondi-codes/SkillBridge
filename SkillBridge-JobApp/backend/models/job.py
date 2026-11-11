from datetime import datetime
import uuid


class Job:
    """Job model for MongoDB"""
    collection_name = 'jobs'

    def __init__(self, data=None):
        """Initialize job from dictionary"""
        if data is None:
            data = {}

        self._id = data.get('_id')
        self.id = data.get('id', str(uuid.uuid4()))
        self.employer_id = data.get('employer_id')

        # Job details
        self.title = data.get('title')
        self.description = data.get('description')
        self.requirements = data.get('requirements', [])
        self.responsibilities = data.get('responsibilities', [])

        # Job classification
        self.category = data.get('category')
        self.employment_type = data.get('employment_type')
        self.experience_level = data.get('experience_level')

        # Location and compensation
        self.location = data.get('location')
        self.remote_allowed = data.get('remote_allowed', False)
        self.salary_min = data.get('salary_min')
        self.salary_max = data.get('salary_max')
        self.salary_currency = data.get('salary_currency', 'KES')

        # Additional details
        self.required_skills = data.get('required_skills', [])
        self.preferred_skills = data.get('preferred_skills', [])
        self.education_level = data.get('education_level')
        self.experience_years = data.get('experience_years')

        # Application settings
        self.application_deadline = data.get('application_deadline')
        self.positions_available = data.get('positions_available', 1)

        # Vector reference
        self.vector_id = data.get('vector_id')

        # Status
        self.status = data.get('status', 'active')

        # Timestamps
        self.posted_at = data.get('posted_at', datetime.utcnow())
        self.updated_at = data.get('updated_at', datetime.utcnow())
        self.closed_at = data.get('closed_at')

        # Metrics
        self.views_count = data.get('views_count', 0)
        self.applications_count = data.get('applications_count', 0)

    def to_dict(self, include_employer=False, employer_data=None):
        """Convert job to dictionary"""
        data = {
            'id': self.id,
            'employer_id': self.employer_id,
            'title': self.title,
            'description': self.description,
            'requirements': self.requirements,
            'responsibilities': self.responsibilities,
            'category': self.category,
            'employment_type': self.employment_type,
            'experience_level': self.experience_level,
            'location': self.location,
            'remote_allowed': self.remote_allowed,
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'salary_currency': self.salary_currency,
            'required_skills': self.required_skills,
            'preferred_skills': self.preferred_skills,
            'education_level': self.education_level,
            'experience_years': self.experience_years,
            'application_deadline': self.application_deadline.isoformat() if isinstance(self.application_deadline, datetime) else self.application_deadline,
            'positions_available': self.positions_available,
            'status': self.status,
            'posted_at': self.posted_at.isoformat() if isinstance(self.posted_at, datetime) else self.posted_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
            'views_count': self.views_count,
            'applications_count': self.applications_count
        }

        if include_employer and employer_data:
            data['employer'] = employer_data
            # Add company info at top level for easier frontend access
            data['company_name'] = employer_data.get('company_name')
            data['company_logo'] = employer_data.get('company_logo')

        return data

    def to_mongo(self):
        """Convert to MongoDB document"""
        doc = {
            'id': self.id,
            'employer_id': self.employer_id,
            'title': self.title,
            'description': self.description,
            'requirements': self.requirements,
            'responsibilities': self.responsibilities,
            'category': self.category,
            'employment_type': self.employment_type,
            'experience_level': self.experience_level,
            'location': self.location,
            'remote_allowed': self.remote_allowed,
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'salary_currency': self.salary_currency,
            'required_skills': self.required_skills,
            'preferred_skills': self.preferred_skills,
            'education_level': self.education_level,
            'experience_years': self.experience_years,
            'application_deadline': self.application_deadline,
            'positions_available': self.positions_available,
            'vector_id': self.vector_id,
            'status': self.status,
            'posted_at': self.posted_at,
            'updated_at': self.updated_at,
            'closed_at': self.closed_at,
            'views_count': self.views_count,
            'applications_count': self.applications_count
        }

        if self._id:
            doc['_id'] = self._id

        return doc

    @staticmethod
    def from_mongo(doc):
        """Create Job instance from MongoDB document"""
        if doc is None:
            return None
        return Job(doc)

    def __repr__(self):
        return f'<Job {self.title}>'
