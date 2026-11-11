import pytest
from app import create_app
from models import db, User
import json


@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Create authenticated headers"""
    # Register user
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'Test123!@#',
        'role': 'candidate',
        'first_name': 'Test',
        'last_name': 'User'
    })

    data = json.loads(response.data)
    token = data['data']['tokens']['access_token']

    return {
        'Authorization': f'Bearer {token}'
    }


class TestAuth:
    """Test authentication endpoints"""

    def test_register(self, client):
        """Test user registration"""
        response = client.post('/api/auth/register', json={
            'email': 'newuser@example.com',
            'password': 'NewUser123!',
            'role': 'candidate',
            'first_name': 'New',
            'last_name': 'User'
        })

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'tokens' in data['data']

    def test_login(self, client, auth_headers):
        """Test user login"""
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'Test123!@#'
        })

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'tokens' in data['data']

    def test_get_current_user(self, client, auth_headers):
        """Test get current user"""
        response = client.get('/api/auth/me', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['data']['email'] == 'test@example.com'


class TestJobs:
    """Test job endpoints"""

    def test_list_jobs(self, client):
        """Test listing jobs"""
        response = client.get('/api/jobs')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True


class TestHealth:
    """Test health check"""

    def test_health_check(self, client):
        """Test health endpoint"""
        response = client.get('/health')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
