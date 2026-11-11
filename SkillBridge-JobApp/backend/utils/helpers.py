from typing import Any, Dict, Optional
from datetime import datetime


def format_error_response(message: str, status_code: int = 400,
                          errors: Optional[Dict] = None) -> tuple:
    """Format error response"""
    response = {
        'success': False,
        'error': message,
        'timestamp': datetime.utcnow().isoformat()
    }

    if errors:
        response['errors'] = errors

    return response, status_code


def format_success_response(data: Any = None, message: str = None,
                           status_code: int = 200) -> tuple:
    """Format success response"""
    response = {
        'success': True,
        'timestamp': datetime.utcnow().isoformat()
    }

    if message:
        response['message'] = message

    if data is not None:
        response['data'] = data

    return response, status_code


def paginate_results(query, page: int, per_page: int) -> Dict:
    """Paginate database query results"""
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        'items': [item.to_dict() for item in pagination.items],
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total_pages': pagination.pages,
            'total_items': pagination.total
        }
    }
