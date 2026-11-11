from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
import uuid


class User:
    """User model for MongoDB"""
    collection_name = 'users'

    def __init__(self, data=None):
        """Initialize user from dictionary"""
        if data is None:
            data = {}

        self._id = data.get('_id')
        self.id = data.get('id', str(uuid.uuid4()))
        self.email = data.get('email')
        self.password_hash = data.get('password_hash')
        self.role = data.get('role')  # 'candidate', 'employer', 'admin'

        # Profile Information
        self.first_name = data.get('first_name')
        self.last_name = data.get('last_name')
        self.phone = data.get('phone')
        self.location = data.get('location')
        self.profile_image = data.get('profile_image')

        # For employers
        self.company_name = data.get('company_name')
        self.company_description = data.get('company_description')
        self.company_website = data.get('company_website')
        self.company_logo = data.get('company_logo')

        # Account status
        self.is_active = data.get('is_active', True)
        self.is_verified = data.get('is_verified', False)
        self.verification_token = data.get('verification_token')

        # Timestamps
        self.created_at = data.get('created_at', datetime.utcnow())
        self.updated_at = data.get('updated_at', datetime.utcnow())
        self.last_login = data.get('last_login')

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_email=True):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'location': self.location,
            'profile_image': self.profile_image,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'last_login': self.last_login.isoformat() if isinstance(self.last_login, datetime) else self.last_login
        }

        if include_email:
            data['email'] = self.email

        if self.role == 'employer':
            data.update({
                'company_name': self.company_name,
                'company_description': self.company_description,
                'company_website': self.company_website,
                'company_logo': self.company_logo,
            })

        return data

    def to_mongo(self):
        """Convert to MongoDB document"""
        doc = {
            'id': self.id,
            'email': self.email,
            'password_hash': self.password_hash,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'location': self.location,
            'profile_image': self.profile_image,
            'company_name': self.company_name,
            'company_description': self.company_description,
            'company_website': self.company_website,
            'company_logo': self.company_logo,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'verification_token': self.verification_token,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'last_login': self.last_login
        }

        if self._id:
            doc['_id'] = self._id

        return doc

    @staticmethod
    def from_mongo(doc):
        """Create User instance from MongoDB document"""
        if doc is None:
            return None
        return User(doc)

    def __repr__(self):
        return f'<User {self.email}>'
