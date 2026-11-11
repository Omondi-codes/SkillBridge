from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from models import User
from services.auth_service import AuthService
from utils.validators import validate_email, validate_password
from utils.helpers import format_error_response, format_success_response
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)


def get_db():
    """Get MongoDB database from current app context"""
    return current_app.mongo_db


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        db = get_db()

        # Validate required fields
        required_fields = ['email', 'password', 'role', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return format_error_response(f"Missing required field: {field}", 400)

        # Validate email
        email = data['email'].lower()
        is_valid_email, email_error = validate_email(email)
        if not is_valid_email:
            return format_error_response(email_error, 400)

        # Validate password
        is_valid_password, password_error = validate_password(data['password'])
        if not is_valid_password:
            return format_error_response(password_error, 400)

        # Validate role
        if data['role'] not in ['candidate', 'employer', 'admin']:
            return format_error_response("Invalid role. Must be 'candidate', 'employer', or 'admin'", 400)

        # Check if user already exists
        existing_user = db.users.find_one({'email': email})
        if existing_user:
            return format_error_response("User with this email already exists", 409)

        # Create new user
        user_data = {
            'email': email,
            'role': data['role'],
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'phone': data.get('phone'),
            'location': data.get('location')
        }

        user = User(user_data)
        user.set_password(data['password'])

        # Add employer-specific fields
        if data['role'] == 'employer':
            user.company_name = data.get('company_name')
            user.company_description = data.get('company_description')
            user.company_website = data.get('company_website')

        # Generate verification token
        user.verification_token = AuthService.generate_verification_token()

        # Insert into MongoDB
        db.users.insert_one(user.to_mongo())

        logger.info(f"New user registered: {email}")

        # Generate tokens
        tokens = AuthService.generate_tokens(user.id, user.role)

        return format_success_response({
            'user': user.to_dict(),
            'tokens': tokens
        }, "Registration successful", 201)

    except Exception as e:
        logger.error(f"Registration error: {e}")
        return format_error_response("Registration failed", 500)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        db = get_db()

        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return format_error_response("Email and password are required", 400)

        email = data['email'].lower()

        # Find user
        user_doc = db.users.find_one({'email': email})

        if not user_doc:
            return format_error_response("Invalid email or password", 401)

        user = User.from_mongo(user_doc)

        if not user.check_password(data['password']):
            return format_error_response("Invalid email or password", 401)

        # Check if user is active
        if not user.is_active:
            return format_error_response("Account is deactivated", 403)

        # Update last login
        db.users.update_one(
            {'id': user.id},
            {'$set': {'last_login': datetime.utcnow()}}
        )

        # Generate tokens
        tokens = AuthService.generate_tokens(user.id, user.role)

        logger.info(f"User logged in: {email}")

        return format_success_response({
            'user': user.to_dict(),
            'tokens': tokens
        }, "Login successful")

    except Exception as e:
        logger.error(f"Login error: {e}")
        return format_error_response("Login failed", 500)


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()

        user_doc = db.users.find_one({'id': current_user_id})
        if not user_doc:
            return format_error_response("User not found", 404)

        user = User.from_mongo(user_doc)
        if not user.is_active:
            return format_error_response("Account is deactivated", 403)

        # Generate new tokens
        tokens = AuthService.generate_tokens(user.id, user.role)

        return format_success_response({
            'tokens': tokens
        }, "Token refreshed successfully")

    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return format_error_response("Token refresh failed", 500)


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()

        user_doc = db.users.find_one({'id': current_user_id})
        if not user_doc:
            return format_error_response("User not found", 404)

        user = User.from_mongo(user_doc)
        return format_success_response(user.to_dict())

    except Exception as e:
        logger.error(f"Get current user error: {e}")
        return format_error_response("Failed to retrieve user", 500)


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user profile"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()

        user_doc = db.users.find_one({'id': current_user_id})
        if not user_doc:
            return format_error_response("User not found", 404)

        user = User.from_mongo(user_doc)
        data = request.get_json()

        # Update allowed fields
        update_data = {}
        allowed_fields = ['first_name', 'last_name', 'phone', 'location', 'profile_image']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        # Update employer-specific fields
        if user.role == 'employer':
            employer_fields = ['company_name', 'company_description', 'company_website']
            for field in employer_fields:
                if field in data:
                    update_data[field] = data[field]

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            db.users.update_one({'id': current_user_id}, {'$set': update_data})

        # Get updated user
        user_doc = db.users.find_one({'id': current_user_id})
        user = User.from_mongo(user_doc)

        logger.info(f"User profile updated: {user.email}")

        return format_success_response(user.to_dict(), "Profile updated successfully")

    except Exception as e:
        logger.error(f"Update user error: {e}")
        return format_error_response("Failed to update profile", 500)


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()

        user_doc = db.users.find_one({'id': current_user_id})
        if not user_doc:
            return format_error_response("User not found", 404)

        user = User.from_mongo(user_doc)
        data = request.get_json()

        # Validate required fields
        if not data.get('current_password') or not data.get('new_password'):
            return format_error_response("Current password and new password are required", 400)

        # Verify current password
        if not user.check_password(data['current_password']):
            return format_error_response("Current password is incorrect", 401)

        # Validate new password
        is_valid, error_message = validate_password(data['new_password'])
        if not is_valid:
            return format_error_response(error_message, 400)

        # Update password
        user.set_password(data['new_password'])
        db.users.update_one(
            {'id': current_user_id},
            {'$set': {'password_hash': user.password_hash, 'updated_at': datetime.utcnow()}}
        )

        logger.info(f"Password changed for user: {user.email}")

        return format_success_response(None, "Password changed successfully")

    except Exception as e:
        logger.error(f"Change password error: {e}")
        return format_error_response("Failed to change password", 500)


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    # In a production app, you might want to blacklist the token
    return format_success_response(None, "Logged out successfully")
