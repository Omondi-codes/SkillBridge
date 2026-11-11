# SkillBridge API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "candidate",  // or "employer"
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+254712345678",
  "location": "Nairobi",
  // For employers only:
  "company_name": "Acme Corp",
  "company_description": "Leading tech company",
  "company_website": "https://acme.com"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "candidate",
      ...
    },
    "tokens": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "token_type": "Bearer"
    }
  },
  "message": "Registration successful"
}
```

### Login
**POST** `/auth/login`

Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {...}
  },
  "message": "Login successful"
}
```

### Refresh Token
**POST** `/auth/refresh`

Get a new access token using refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response:** `200 OK`

### Get Current User
**GET** `/auth/me`

Get current authenticated user's profile.

**Response:** `200 OK`

### Update Profile
**PUT** `/auth/me`

Update current user's profile.

**Request Body:**
```json
{
  "first_name": "Jane",
  "location": "Mombasa",
  "phone": "+254723456789"
}
```

**Response:** `200 OK`

### Change Password
**POST** `/auth/change-password`

Change user password.

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!"
}
```

**Response:** `200 OK`

---

## Resume Endpoints

### Upload Resume
**POST** `/resumes/upload`

Upload and parse a resume (PDF, DOC, DOCX, TXT).

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <resume_file>
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "resume_id": "mongodb_id",
    "vector_id": "qdrant_vector_id",
    "parsed_data": {
      "personal_info": {...},
      "skills": ["Python", "JavaScript", ...],
      "experience": [...],
      "education": [...],
      "certifications": [...]
    }
  }
}
```

### Get Resume
**GET** `/resumes/<resume_id>`

Get resume details.

**Response:** `200 OK`

### Update Resume
**PUT** `/resumes/<resume_id>`

Update resume data.

**Request Body:**
```json
{
  "parsed_data": {
    "skills": ["Python", "React", "AWS"],
    ...
  }
}
```

**Response:** `200 OK`

### Delete Resume
**DELETE** `/resumes/<resume_id>`

Delete a resume.

**Response:** `200 OK`

### Get My Resumes
**GET** `/resumes/my-resumes`

Get all resumes for current user.

**Response:** `200 OK`

---

## Job Endpoints

### Create Job
**POST** `/jobs`

Create a new job posting (Employer only).

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "description": "We are looking for...",
  "category": "IT",
  "employment_type": "full-time",
  "experience_level": "senior",
  "location": "Nairobi",
  "remote_allowed": true,
  "salary_min": 150000,
  "salary_max": 250000,
  "salary_currency": "KES",
  "required_skills": ["Python", "Django", "PostgreSQL"],
  "preferred_skills": ["React", "AWS"],
  "education_level": "Bachelor's Degree",
  "experience_years": 5,
  "positions_available": 2,
  "application_deadline": "2025-11-01T00:00:00Z"
}
```

**Response:** `201 Created`

### List Jobs
**GET** `/jobs`

Get all active jobs with optional filters.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20)
- `category` (string): Filter by category
- `location` (string): Filter by location
- `employment_type` (string): Filter by employment type
- `experience_level` (string): Filter by experience level
- `search` (string): Search in title and description

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_pages": 5,
      "total_items": 100
    }
  }
}
```

### Get Job
**GET** `/jobs/<job_id>`

Get job details.

**Response:** `200 OK`

### Update Job
**PUT** `/jobs/<job_id>`

Update job posting (Employer/Admin only).

**Response:** `200 OK`

### Delete Job
**DELETE** `/jobs/<job_id>`

Delete job posting (Employer/Admin only).

**Response:** `200 OK`

### Get My Jobs
**GET** `/jobs/my-jobs`

Get all jobs posted by current employer.

**Query Parameters:**
- `page` (int)
- `per_page` (int)
- `status` (string): Filter by status

**Response:** `200 OK`

### Close Job
**POST** `/jobs/<job_id>/close`

Close job posting.

**Response:** `200 OK`

---

## Matching Endpoints

### Get Matched Jobs
**GET** `/matching/jobs`

Get matched jobs for current candidate.

**Query Parameters:**
- `location` (string): Filter by location
- `employment_type` (string): Filter by type
- `min_salary` (int): Minimum salary
- `limit` (int): Number of results (default: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "job": {...},
        "matching": {
          "similarity_score": 0.85,
          "overall_score": 0.82,
          "skill_match_percentage": 80.0,
          "experience_match": true,
          "location_match": true,
          "details": {...}
        }
      }
    ],
    "count": 10
  }
}
```

### Get Matched Candidates
**GET** `/matching/candidates`

Get matched candidates for a job (Employer only).

**Query Parameters:**
- `job_id` (required): Job ID
- `location` (string)
- `min_experience` (int)
- `limit` (int): Default 20

**Response:** `200 OK`

### Apply to Job
**POST** `/matching/apply`

Submit job application.

**Request Body:**
```json
{
  "job_id": "uuid",
  "cover_letter": "I am interested in...",
  "custom_responses": {
    "question1": "answer1"
  }
}
```

**Response:** `201 Created`

### Get My Applications
**GET** `/matching/applications`

Get all applications for current candidate.

**Query Parameters:**
- `status` (string): Filter by status

**Response:** `200 OK`

### Get Job Applications
**GET** `/matching/job/<job_id>/applications`

Get all applications for a job (Employer only).

**Query Parameters:**
- `status` (string): Filter by status

**Response:** `200 OK`

### Update Application Status
**PUT** `/matching/application/<application_id>`

Update application status (Employer only).

**Request Body:**
```json
{
  "status": "reviewed",  // pending, reviewed, shortlisted, interviewed, offered, rejected, withdrawn
  "employer_notes": "Strong candidate",
  "rating": 4,
  "interview_scheduled": "2025-11-15T10:00:00Z"
}
```

**Response:** `200 OK`

### Get Matching Score
**POST** `/matching/score`

Get detailed matching score between resume and job.

**Request Body:**
```json
{
  "job_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "job": {...},
    "match_details": {
      "overall_score": 0.85,
      "skill_match_percentage": 80.0,
      "matched_required_skills": ["Python", "Django"],
      "missing_skills": ["Kubernetes"],
      "experience_match": true,
      ...
    },
    "explanation": "AI-generated explanation..."
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request**
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-10-02T12:00:00Z"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Invalid token"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions."
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse. Implement rate limiting in production.

## Authentication Flow

1. Register/Login to get access and refresh tokens
2. Use access token for API requests
3. When access token expires (1 hour), use refresh token to get new access token
4. Refresh token valid for 30 days

## Roles

- **candidate**: Can upload resumes, apply to jobs, view matches
- **employer**: Can post jobs, view applications, manage candidates
- **admin**: Full access to all resources
