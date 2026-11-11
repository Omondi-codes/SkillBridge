#!/usr/bin/env python3
"""
Comprehensive Test Script for SkillBridge Platform
Tests all major functionalities end-to-end
"""
import requests
import json
import time
from pathlib import Path
from typing import Dict, Optional
import sys

# Configuration
BASE_URL = "http://localhost:5000"
API_URL = f"{BASE_URL}/api"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

class TestTracker:
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.tests = []

    def add_test(self, name: str, passed: bool, message: str = ""):
        self.total += 1
        if passed:
            self.passed += 1
            status = f"{Colors.GREEN}✓ PASS{Colors.END}"
        else:
            self.failed += 1
            status = f"{Colors.RED}✗ FAIL{Colors.END}"

        self.tests.append({
            'name': name,
            'passed': passed,
            'message': message
        })

        print(f"{status} - {name}")
        if message and not passed:
            print(f"  {Colors.YELLOW}└─ {message}{Colors.END}")

    def print_summary(self):
        print("\n" + "="*70)
        print(f"{Colors.BOLD}TEST SUMMARY{Colors.END}")
        print("="*70)
        print(f"Total Tests: {self.total}")
        print(f"{Colors.GREEN}Passed: {self.passed}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.failed}{Colors.END}")

        if self.failed > 0:
            print(f"\n{Colors.RED}Failed Tests:{Colors.END}")
            for test in self.tests:
                if not test['passed']:
                    print(f"  - {test['name']}")
                    if test['message']:
                        print(f"    {test['message']}")

        success_rate = (self.passed / self.total * 100) if self.total > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        print("="*70)

tracker = TestTracker()

# Test Data Storage
test_data = {
    'candidate1': {},
    'candidate2': {},
    'employer1': {},
    'employer2': {},
    'admin': {},
    'jobs': [],
    'resumes': [],
    'applications': []
}

def print_header(text: str):
    """Print section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
    print(f"{text}")
    print(f"{'='*70}{Colors.END}\n")

def make_request(method: str, endpoint: str, data: Optional[Dict] = None,
                files: Optional[Dict] = None, token: Optional[str] = None) -> requests.Response:
    """Make HTTP request with error handling"""
    url = f"{API_URL}{endpoint}"
    headers = {}

    if token:
        headers['Authorization'] = f'Bearer {token}'

    if data and not files:
        headers['Content-Type'] = 'application/json'

    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=data)
        elif method == 'POST':
            if files:
                response = requests.post(url, headers=headers, data=data, files=files)
            else:
                response = requests.post(url, headers=headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")

        return response
    except requests.exceptions.ConnectionError:
        print(f"{Colors.RED}ERROR: Could not connect to server at {BASE_URL}")
        print(f"Please ensure the Flask server is running.{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"{Colors.RED}ERROR: {str(e)}{Colors.END}")
        return None

# ============================================================================
# TEST 1: Health Check
# ============================================================================
def test_health_check():
    print_header("TEST 1: HEALTH CHECK")

    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)

        if response.status_code == 200:
            data = response.json()
            tracker.add_test("Health check endpoint", data.get('status') == 'healthy')
            tracker.add_test("Service name correct", data.get('service') == 'SkillBridge API')
        else:
            tracker.add_test("Health check endpoint", False, f"Status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"{Colors.RED}ERROR: Cannot connect to {BASE_URL}")
        print(f"Please start the Flask server: python app.py{Colors.END}")
        sys.exit(1)

# ============================================================================
# TEST 2: User Registration
# ============================================================================
def test_user_registration():
    print_header("TEST 2: USER REGISTRATION")

    # Test Candidate 1
    response = make_request('POST', '/auth/register', {
        'email': 'john.candidate@test.com',
        'password': 'TestPass123!',
        'role': 'candidate',
        'first_name': 'John',
        'last_name': 'Candidate',
        'phone': '+254712345678',
        'location': 'Nairobi'
    })

    if response and response.status_code == 201:
        data = response.json()
        test_data['candidate1'] = {
            'user': data['data']['user'],
            'token': data['data']['tokens']['access_token'],
            'refresh_token': data['data']['tokens']['refresh_token']
        }
        tracker.add_test("Register candidate 1", True)
    else:
        tracker.add_test("Register candidate 1", False,
                        f"Status: {response.status_code if response else 'No response'}")

    # Test Candidate 2
    response = make_request('POST', '/auth/register', {
        'email': 'mary.candidate@test.com',
        'password': 'TestPass123!',
        'role': 'candidate',
        'first_name': 'Mary',
        'last_name': 'Wanjiru',
        'phone': '+254723456789',
        'location': 'Kisumu'
    })

    if response and response.status_code == 201:
        data = response.json()
        test_data['candidate2'] = {
            'user': data['data']['user'],
            'token': data['data']['tokens']['access_token']
        }
        tracker.add_test("Register candidate 2", True)
    else:
        tracker.add_test("Register candidate 2", False)

    # Test Employer 1
    response = make_request('POST', '/auth/register', {
        'email': 'hr@testcompany.com',
        'password': 'TestPass123!',
        'role': 'employer',
        'first_name': 'HR',
        'last_name': 'Manager',
        'company_name': 'Test Tech Company',
        'company_description': 'Leading tech company in Kenya',
        'company_website': 'https://testtech.co.ke',
        'location': 'Nairobi'
    })

    if response and response.status_code == 201:
        data = response.json()
        test_data['employer1'] = {
            'user': data['data']['user'],
            'token': data['data']['tokens']['access_token']
        }
        tracker.add_test("Register employer 1", True)
    else:
        tracker.add_test("Register employer 1", False)

    # Test duplicate registration (should fail)
    response = make_request('POST', '/auth/register', {
        'email': 'john.candidate@test.com',
        'password': 'TestPass123!',
        'role': 'candidate',
        'first_name': 'John',
        'last_name': 'Duplicate'
    })

    tracker.add_test("Duplicate registration rejected", response.status_code == 409)

# ============================================================================
# TEST 3: User Login
# ============================================================================
def test_user_login():
    print_header("TEST 3: USER LOGIN")

    # Test candidate login
    response = make_request('POST', '/auth/login', {
        'email': 'john.candidate@test.com',
        'password': 'TestPass123!'
    })

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Candidate login successful", True)
        tracker.add_test("Login returns access token", 'access_token' in data['data']['tokens'])
    else:
        tracker.add_test("Candidate login successful", False)

    # Test wrong password (should fail)
    response = make_request('POST', '/auth/login', {
        'email': 'john.candidate@test.com',
        'password': 'WrongPassword123!'
    })

    tracker.add_test("Wrong password rejected", response.status_code == 401)

    # Test non-existent user (should fail)
    response = make_request('POST', '/auth/login', {
        'email': 'nonexistent@test.com',
        'password': 'TestPass123!'
    })

    tracker.add_test("Non-existent user rejected", response.status_code == 401)

# ============================================================================
# TEST 4: Get Current User
# ============================================================================
def test_get_current_user():
    print_header("TEST 4: GET CURRENT USER")

    token = test_data['candidate1'].get('token')

    if not token:
        tracker.add_test("Get current user", False, "No token available")
        return

    response = make_request('GET', '/auth/me', token=token)

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Get current user", True)
        tracker.add_test("User email matches",
                        data['data']['email'] == 'john.candidate@test.com')
        tracker.add_test("User role is candidate",
                        data['data']['role'] == 'candidate')
    else:
        tracker.add_test("Get current user", False)

# ============================================================================
# TEST 5: Update User Profile
# ============================================================================
def test_update_profile():
    print_header("TEST 5: UPDATE USER PROFILE")

    token = test_data['candidate1'].get('token')

    response = make_request('PUT', '/auth/me',
        data={'location': 'Mombasa', 'phone': '+254734567890'},
        token=token
    )

    if response and response.status_code == 200:
        tracker.add_test("Update user profile", True)

        # Verify update
        verify = make_request('GET', '/auth/me', token=token)
        if verify and verify.status_code == 200:
            data = verify.json()
            tracker.add_test("Profile location updated",
                            data['data']['location'] == 'Mombasa')
    else:
        tracker.add_test("Update user profile", False)

# ============================================================================
# TEST 6: Resume Upload
# ============================================================================
def test_resume_upload():
    print_header("TEST 6: RESUME UPLOAD")

    token = test_data['candidate1'].get('token')
    resume_path = Path(__file__).parent.parent / 'sample_resumes' / 'john_doe_resume.pdf'

    if not resume_path.exists():
        # Try txt file
        resume_path = Path(__file__).parent.parent / 'sample_resumes' / 'john_doe_resume.txt'

    if not resume_path.exists():
        tracker.add_test("Resume upload", False, "Resume file not found")
        return

    with open(resume_path, 'rb') as f:
        files = {'file': (resume_path.name, f, 'application/pdf')}
        response = make_request('POST', '/resumes/upload', files=files, token=token)

    if response and response.status_code == 201:
        data = response.json()
        test_data['resumes'].append({
            'resume_id': data['data']['resume_id'],
            'vector_id': data['data']['vector_id'],
            'user': 'candidate1'
        })
        tracker.add_test("Resume upload successful", True)
        tracker.add_test("Resume parsing returned data",
                        'parsed_data' in data['data'])
        tracker.add_test("Skills extracted",
                        len(data['data']['parsed_data'].get('skills', [])) > 0)
    else:
        tracker.add_test("Resume upload successful", False,
                        f"Status: {response.status_code if response else 'No response'}")

# ============================================================================
# TEST 7: Get My Resumes
# ============================================================================
def test_get_my_resumes():
    print_header("TEST 7: GET MY RESUMES")

    token = test_data['candidate1'].get('token')

    response = make_request('GET', '/resumes/my-resumes', token=token)

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Get my resumes", True)
        tracker.add_test("Resumes list returned",
                        isinstance(data['data']['resumes'], list))
        tracker.add_test("Resume count correct",
                        data['data']['count'] >= 1)
    else:
        tracker.add_test("Get my resumes", False)

# ============================================================================
# TEST 8: Create Job Postings
# ============================================================================
def test_create_jobs():
    print_header("TEST 8: CREATE JOB POSTINGS")

    token = test_data['employer1'].get('token')

    # Job 1: Senior Software Engineer
    response = make_request('POST', '/jobs', data={
        'title': 'Senior Software Engineer',
        'description': 'We are looking for an experienced software engineer to join our team. Must have strong skills in Python, JavaScript, and cloud technologies.',
        'category': 'IT',
        'employment_type': 'full-time',
        'experience_level': 'senior',
        'location': 'Nairobi',
        'remote_allowed': True,
        'salary_min': 150000,
        'salary_max': 250000,
        'salary_currency': 'KES',
        'required_skills': ['Python', 'JavaScript', 'AWS', 'Docker', 'PostgreSQL'],
        'preferred_skills': ['Kubernetes', 'React', 'Machine Learning'],
        'education_level': "Bachelor's Degree",
        'experience_years': 5,
        'positions_available': 2
    }, token=token)

    if response and response.status_code == 201:
        data = response.json()
        test_data['jobs'].append({
            'job_id': data['data']['id'],
            'title': data['data']['title']
        })
        tracker.add_test("Create senior software engineer job", True)
    else:
        tracker.add_test("Create senior software engineer job", False)

    # Job 2: Junior Developer
    response = make_request('POST', '/jobs', data={
        'title': 'Junior Full Stack Developer',
        'description': 'Seeking a junior developer with knowledge of React and Node.js.',
        'category': 'IT',
        'employment_type': 'full-time',
        'experience_level': 'entry',
        'location': 'Nairobi',
        'remote_allowed': False,
        'salary_min': 80000,
        'salary_max': 120000,
        'required_skills': ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        'preferred_skills': ['TypeScript', 'Docker'],
        'education_level': "Bachelor's Degree",
        'experience_years': 1,
        'positions_available': 3
    }, token=token)

    if response and response.status_code == 201:
        data = response.json()
        test_data['jobs'].append({
            'job_id': data['data']['id'],
            'title': data['data']['title']
        })
        tracker.add_test("Create junior developer job", True)
    else:
        tracker.add_test("Create junior developer job", False)

    # Job 3: Data Scientist
    response = make_request('POST', '/jobs', data={
        'title': 'Data Scientist',
        'description': 'Looking for a data scientist with ML and Python expertise.',
        'category': 'IT',
        'employment_type': 'full-time',
        'experience_level': 'mid',
        'location': 'Nairobi',
        'remote_allowed': True,
        'salary_min': 120000,
        'salary_max': 180000,
        'required_skills': ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
        'preferred_skills': ['Deep Learning', 'PyTorch', 'Tableau'],
        'experience_years': 3
    }, token=token)

    if response and response.status_code == 201:
        data = response.json()
        test_data['jobs'].append({
            'job_id': data['data']['id'],
            'title': data['data']['title']
        })
        tracker.add_test("Create data scientist job", True)
    else:
        tracker.add_test("Create data scientist job", False)

# ============================================================================
# TEST 9: List Jobs
# ============================================================================
def test_list_jobs():
    print_header("TEST 9: LIST JOBS")

    # List all jobs (no auth required)
    response = make_request('GET', '/jobs')

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("List all jobs", True)
        tracker.add_test("Jobs array returned",
                        isinstance(data['data']['items'], list))
        tracker.add_test("At least 3 jobs created",
                        len(data['data']['items']) >= 3)
    else:
        tracker.add_test("List all jobs", False)

    # Test filtering by location
    response = make_request('GET', '/jobs', data={'location': 'Nairobi'})

    if response and response.status_code == 200:
        tracker.add_test("Filter jobs by location", True)
    else:
        tracker.add_test("Filter jobs by location", False)

    # Test search
    response = make_request('GET', '/jobs', data={'search': 'developer'})

    if response and response.status_code == 200:
        tracker.add_test("Search jobs by keyword", True)
    else:
        tracker.add_test("Search jobs by keyword", False)

# ============================================================================
# TEST 10: Get Job Details
# ============================================================================
def test_get_job_details():
    print_header("TEST 10: GET JOB DETAILS")

    if not test_data['jobs']:
        tracker.add_test("Get job details", False, "No jobs available")
        return

    job_id = test_data['jobs'][0]['job_id']

    response = make_request('GET', f'/jobs/{job_id}')

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Get job details", True)
        tracker.add_test("Job has employer info",
                        'employer' in data['data'])
        tracker.add_test("Job has required skills",
                        len(data['data'].get('required_skills', [])) > 0)
    else:
        tracker.add_test("Get job details", False)

# ============================================================================
# TEST 11: Get My Jobs (Employer)
# ============================================================================
def test_get_my_jobs():
    print_header("TEST 11: GET MY JOBS (EMPLOYER)")

    token = test_data['employer1'].get('token')

    response = make_request('GET', '/jobs/my-jobs', token=token)

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Get my jobs (employer)", True)
        tracker.add_test("Employer has jobs",
                        len(data['data']['items']) >= 3)
    else:
        tracker.add_test("Get my jobs (employer)", False)

# ============================================================================
# TEST 12: Get Matched Jobs (Candidate)
# ============================================================================
def test_get_matched_jobs():
    print_header("TEST 12: GET MATCHED JOBS (CANDIDATE)")

    token = test_data['candidate1'].get('token')

    if not test_data['resumes']:
        tracker.add_test("Get matched jobs", False, "No resume uploaded")
        return

    time.sleep(2)  # Wait for vector processing

    response = make_request('GET', '/matching/jobs', token=token)

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Get matched jobs", True)
        tracker.add_test("Matches returned",
                        isinstance(data['data']['matches'], list))

        if data['data']['matches']:
            match = data['data']['matches'][0]
            tracker.add_test("Match has similarity score",
                            'similarity_score' in match['matching'])
            tracker.add_test("Match has skill percentage",
                            'skill_match_percentage' in match['matching'])
    else:
        tracker.add_test("Get matched jobs", False,
                        f"Status: {response.status_code if response else 'No response'}")

# ============================================================================
# TEST 13: Apply to Job
# ============================================================================
def test_apply_to_job():
    print_header("TEST 13: APPLY TO JOB")

    token = test_data['candidate1'].get('token')

    if not test_data['jobs']:
        tracker.add_test("Apply to job", False, "No jobs available")
        return

    job_id = test_data['jobs'][0]['job_id']

    response = make_request('POST', '/matching/apply', data={
        'job_id': job_id,
        'cover_letter': 'I am very interested in this position and believe my skills align well with the requirements.'
    }, token=token)

    if response and response.status_code == 201:
        data = response.json()
        test_data['applications'].append({
            'application_id': data['data']['id'],
            'job_id': job_id
        })
        tracker.add_test("Apply to job", True)
        tracker.add_test("Application has matching score",
                        data['data']['matching_score'] is not None)
    else:
        tracker.add_test("Apply to job", False)

    # Test duplicate application (should fail)
    response = make_request('POST', '/matching/apply', data={
        'job_id': job_id,
        'cover_letter': 'Duplicate application'
    }, token=token)

    tracker.add_test("Duplicate application rejected",
                    response.status_code == 409)

# ============================================================================
# TEST 14: Get My Applications (Candidate)
# ============================================================================
def test_get_my_applications():
    print_header("TEST 14: GET MY APPLICATIONS (CANDIDATE)")

    token = test_data['candidate1'].get('token')

    response = make_request('GET', '/matching/applications', token=token)

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Get my applications", True)
        tracker.add_test("Applications list returned",
                        isinstance(data['data']['applications'], list))
        tracker.add_test("At least one application",
                        data['data']['count'] >= 1)
    else:
        tracker.add_test("Get my applications", False)

# ============================================================================
# TEST 15: Get Job Applications (Employer)
# ============================================================================
def test_get_job_applications():
    print_header("TEST 15: GET JOB APPLICATIONS (EMPLOYER)")

    token = test_data['employer1'].get('token')

    if not test_data['jobs']:
        tracker.add_test("Get job applications", False, "No jobs available")
        return

    job_id = test_data['jobs'][0]['job_id']

    response = make_request('GET', f'/matching/job/{job_id}/applications',
                           token=token)

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Get job applications (employer)", True)
        tracker.add_test("Applications include candidate info",
                        len(data['data']['applications']) > 0 and
                        'candidate' in data['data']['applications'][0])
    else:
        tracker.add_test("Get job applications (employer)", False)

# ============================================================================
# TEST 16: Update Application Status
# ============================================================================
def test_update_application_status():
    print_header("TEST 16: UPDATE APPLICATION STATUS")

    token = test_data['employer1'].get('token')

    if not test_data['applications']:
        tracker.add_test("Update application status", False,
                        "No applications available")
        return

    app_id = test_data['applications'][0]['application_id']

    response = make_request('PUT', f'/matching/application/{app_id}', data={
        'status': 'reviewed',
        'employer_notes': 'Good candidate, scheduling interview',
        'rating': 4
    }, token=token)

    if response and response.status_code == 200:
        tracker.add_test("Update application status", True)
        tracker.add_test("Status updated to reviewed",
                        response.json()['data']['status'] == 'reviewed')
    else:
        tracker.add_test("Update application status", False)

# ============================================================================
# TEST 17: Get Matching Score
# ============================================================================
def test_get_matching_score():
    print_header("TEST 17: GET MATCHING SCORE")

    token = test_data['candidate1'].get('token')

    if not test_data['jobs']:
        tracker.add_test("Get matching score", False, "No jobs available")
        return

    job_id = test_data['jobs'][0]['job_id']

    response = make_request('POST', '/matching/score', data={
        'job_id': job_id
    }, token=token)

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Get matching score", True)
        tracker.add_test("Match details returned",
                        'match_details' in data['data'])
        tracker.add_test("Overall score present",
                        'overall_score' in data['data']['match_details'])
    else:
        tracker.add_test("Get matching score", False)

# ============================================================================
# TEST 18: Update Job
# ============================================================================
def test_update_job():
    print_header("TEST 18: UPDATE JOB")

    token = test_data['employer1'].get('token')

    if not test_data['jobs']:
        tracker.add_test("Update job", False, "No jobs available")
        return

    job_id = test_data['jobs'][0]['job_id']

    response = make_request('PUT', f'/jobs/{job_id}', data={
        'salary_max': 300000,
        'positions_available': 3
    }, token=token)

    if response and response.status_code == 200:
        tracker.add_test("Update job", True)
        tracker.add_test("Job salary updated",
                        response.json()['data']['salary_max'] == 300000)
    else:
        tracker.add_test("Update job", False)

# ============================================================================
# TEST 19: Authorization Tests
# ============================================================================
def test_authorization():
    print_header("TEST 19: AUTHORIZATION TESTS")

    candidate_token = test_data['candidate1'].get('token')
    employer_token = test_data['employer1'].get('token')

    # Candidate should not be able to create jobs
    response = make_request('POST', '/jobs', data={
        'title': 'Unauthorized Job',
        'description': 'This should fail',
        'location': 'Nairobi'
    }, token=candidate_token)

    tracker.add_test("Candidate cannot create jobs",
                    response.status_code == 403)

    # Employer should not be able to upload resumes
    resume_path = Path(__file__).parent.parent / 'sample_resumes' / 'john_doe_resume.txt'

    if resume_path.exists():
        with open(resume_path, 'rb') as f:
            files = {'file': (resume_path.name, f, 'text/plain')}
            response = make_request('POST', '/resumes/upload',
                                  files=files, token=employer_token)

        tracker.add_test("Employer cannot upload resumes",
                        response.status_code == 403)

    # Unauthenticated user cannot access protected routes
    response = make_request('GET', '/auth/me')

    tracker.add_test("Unauthenticated access rejected",
                    response.status_code == 401)

# ============================================================================
# TEST 20: Token Refresh
# ============================================================================
def test_token_refresh():
    print_header("TEST 20: TOKEN REFRESH")

    refresh_token = test_data['candidate1'].get('refresh_token')

    if not refresh_token:
        tracker.add_test("Token refresh", False, "No refresh token available")
        return

    response = make_request('POST', '/auth/refresh', token=refresh_token)

    if response and response.status_code == 200:
        data = response.json()
        tracker.add_test("Token refresh successful", True)
        tracker.add_test("New access token received",
                        'access_token' in data['data']['tokens'])
    else:
        tracker.add_test("Token refresh successful", False)

# ============================================================================
# TEST 21: Change Password
# ============================================================================
def test_change_password():
    print_header("TEST 21: CHANGE PASSWORD")

    token = test_data['candidate1'].get('token')

    response = make_request('POST', '/auth/change-password', data={
        'current_password': 'TestPass123!',
        'new_password': 'NewTestPass123!'
    }, token=token)

    if response and response.status_code == 200:
        tracker.add_test("Change password", True)

        # Verify new password works
        login = make_request('POST', '/auth/login', data={
            'email': 'john.candidate@test.com',
            'password': 'NewTestPass123!'
        })

        tracker.add_test("Login with new password",
                        login.status_code == 200)
    else:
        tracker.add_test("Change password", False)

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def run_all_tests():
    """Run all comprehensive tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║                                                                    ║")
    print("║        SKILLBRIDGE COMPREHENSIVE TEST SUITE                        ║")
    print("║        AI-Powered Job Matching Platform                            ║")
    print("║                                                                    ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}\n")

    print(f"{Colors.YELLOW}Starting comprehensive tests...{Colors.END}")
    print(f"Target: {BASE_URL}\n")

    try:
        # Run all test suites
        test_health_check()
        test_user_registration()
        test_user_login()
        test_get_current_user()
        test_update_profile()
        test_resume_upload()
        test_get_my_resumes()
        test_create_jobs()
        test_list_jobs()
        test_get_job_details()
        test_get_my_jobs()
        test_get_matched_jobs()
        test_apply_to_job()
        test_get_my_applications()
        test_get_job_applications()
        test_update_application_status()
        test_get_matching_score()
        test_update_job()
        test_authorization()
        test_token_refresh()
        test_change_password()

        # Print summary
        tracker.print_summary()

        # Exit with appropriate code
        sys.exit(0 if tracker.failed == 0 else 1)

    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Tests interrupted by user{Colors.END}")
        tracker.print_summary()
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {str(e)}{Colors.END}")
        tracker.print_summary()
        sys.exit(1)

if __name__ == '__main__':
    run_all_tests()
