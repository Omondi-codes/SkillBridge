from datetime import datetime
from typing import Dict, List, Optional
import uuid


class JobAlert:
    """Job Alert model for MongoDB"""
    collection_name = 'job_alerts'

    def __init__(
        self,
        user_id: str,
        keywords: List[str] = None,
        location: str = None,
        category: str = None,
        employment_type: str = None,
        experience_level: str = None,
        min_salary: int = None,
        remote_only: bool = False,
        frequency: str = 'instant',  # instant, daily, weekly
        is_active: bool = True,
        id: str = None,
        created_at: datetime = None,
        updated_at: datetime = None,
        last_sent_at: datetime = None
    ):
        self.id = id or str(uuid.uuid4())
        self.user_id = user_id
        self.keywords = keywords or []
        self.location = location
        self.category = category
        self.employment_type = employment_type
        self.experience_level = experience_level
        self.min_salary = min_salary
        self.remote_only = remote_only
        self.frequency = frequency
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        self.last_sent_at = last_sent_at

    @classmethod
    def from_mongo(cls, doc: Dict):
        """Create JobAlert from MongoDB document"""
        if not doc:
            return None

        return cls(
            id=doc.get('id'),
            user_id=doc.get('user_id'),
            keywords=doc.get('keywords', []),
            location=doc.get('location'),
            category=doc.get('category'),
            employment_type=doc.get('employment_type'),
            experience_level=doc.get('experience_level'),
            min_salary=doc.get('min_salary'),
            remote_only=doc.get('remote_only', False),
            frequency=doc.get('frequency', 'instant'),
            is_active=doc.get('is_active', True),
            created_at=doc.get('created_at'),
            updated_at=doc.get('updated_at'),
            last_sent_at=doc.get('last_sent_at')
        )

    def to_dict(self):
        """Convert JobAlert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'keywords': self.keywords,
            'location': self.location,
            'category': self.category,
            'employment_type': self.employment_type,
            'experience_level': self.experience_level,
            'min_salary': self.min_salary,
            'remote_only': self.remote_only,
            'frequency': self.frequency,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
            'last_sent_at': self.last_sent_at.isoformat() if isinstance(self.last_sent_at, datetime) else self.last_sent_at
        }

    def to_mongo(self):
        """Convert to MongoDB document"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'keywords': self.keywords,
            'location': self.location,
            'category': self.category,
            'employment_type': self.employment_type,
            'experience_level': self.experience_level,
            'min_salary': self.min_salary,
            'remote_only': self.remote_only,
            'frequency': self.frequency,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'last_sent_at': self.last_sent_at
        }

    def matches_job(self, job) -> bool:
        """Check if a job matches this alert's criteria"""
        # Check keywords in title or description
        if self.keywords:
            job_text = f"{job.title} {job.description}".lower()
            if not any(keyword.lower() in job_text for keyword in self.keywords):
                return False

        # Check location (allow partial match)
        if self.location:
            if not job.location or self.location.lower() not in job.location.lower():
                if not (self.remote_only and job.remote_allowed):
                    return False

        # Check category
        if self.category and job.category != self.category:
            return False

        # Check employment type
        if self.employment_type and job.employment_type != self.employment_type:
            return False

        # Check experience level
        if self.experience_level and job.experience_level != self.experience_level:
            return False

        # Check minimum salary
        if self.min_salary and (not job.salary_min or job.salary_min < self.min_salary):
            return False

        # Check remote only
        if self.remote_only and not job.remote_allowed:
            return False

        return True
