import os
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging
from flask_jwt_extended import create_access_token, create_refresh_token

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication and authorization service"""

    @staticmethod
    def generate_tokens(user_id: str, role: str) -> Dict[str, str]:
        """Generate JWT access and refresh tokens"""
        access_token = create_access_token(
            identity=user_id,
            additional_claims={'role': role}
        )
        refresh_token = create_refresh_token(identity=user_id)

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer'
        }

    @staticmethod
    def generate_verification_token() -> str:
        """Generate email verification token"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def verify_token(token: str, expected_token: str) -> bool:
        """Verify token matches"""
        return secrets.compare_digest(token, expected_token)
