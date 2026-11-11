import re
from typing import Tuple
from email_validator import validate_email as email_validate, EmailNotValidError


def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validate email address
    Returns: (is_valid, error_message)
    """
    try:
        email_validate(email)
        return True, ""
    except EmailNotValidError as e:
        return False, str(e)


def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    Requirements:
    - At least 8 characters
    - Contains uppercase and lowercase
    - Contains at least one number
    - Contains at least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"

    return True, ""


def allowed_file(filename: str, allowed_extensions: set = None) -> bool:
    """Check if file extension is allowed"""
    if allowed_extensions is None:
        allowed_extensions = {'pdf', 'doc', 'docx', 'txt'}

    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def validate_phone(phone: str) -> Tuple[bool, str]:
    """Validate phone number (Kenyan format)"""
    # Remove spaces and dashes
    phone = phone.replace(' ', '').replace('-', '')

    # Check for Kenyan phone number formats
    # +254XXXXXXXXX or 0XXXXXXXXX
    if re.match(r'^\+254[17]\d{8}$', phone) or re.match(r'^0[17]\d{8}$', phone):
        return True, ""

    return False, "Invalid phone number format. Use +254XXXXXXXXX or 0XXXXXXXXX"
