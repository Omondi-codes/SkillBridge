# SkillBridge Testing Guide

Quick reference for testing the SkillBridge backend.

## 🚀 Quick Start

### 1. Start the Server
```bash
# Terminal 1: Start Flask
python app.py

# Terminal 2: Start Celery worker
celery -A celery_app worker --loglevel=info
```

### 2. Run Comprehensive Tests
```bash
# Simple one-command test
./run_tests.sh

# Or directly
python3 tests/comprehensive_test.py
```

## 📊 What Gets Tested

The comprehensive test script (`tests/comprehensive_test.py`) automatically:

### ✅ Creates Test Accounts
- 2 Candidates (`john.candidate@test.com`, `mary.candidate@test.com`)
- 1 Employer (`hr@testcompany.com`)
- Tests authentication and authorization

### ✅ Uploads Resumes
- Uses sample resume from `sample_resumes/john_doe_resume.pdf`
- Tests Gemini AI parsing
- Verifies skill extraction
- Checks vector embedding generation

### ✅ Creates Job Postings
- Senior Software Engineer (Nairobi)
- Junior Full Stack Developer (Nairobi)
- Data Scientist (Nairobi)
- Tests job creation, listing, filtering

### ✅ Tests Job Matching
- AI-powered similarity search
- Skill matching algorithm
- Location-based filtering
- Experience level matching

### ✅ Tests Application Flow
- Submit job applications
- Calculate matching scores
- Update application status
- Employer review process

### ✅ Tests Security
- Role-based access control
- JWT token authentication
- Token refresh mechanism
- Password changes
- Unauthorized access prevention

## 📋 Test Categories (21 Total)

| # | Category | Tests | Description |
|---|----------|-------|-------------|
| 1 | Health Check | 2 | Server status, API availability |
| 2 | Registration | 4 | User creation, validation, duplicates |
| 3 | Login | 3 | Authentication, wrong password, non-existent user |
| 4 | Current User | 3 | Token validation, user data |
| 5 | Profile Update | 2 | Modify user information |
| 6 | Resume Upload | 3 | File upload, parsing, skill extraction |
| 7 | My Resumes | 3 | List resumes, verify data |
| 8 | Create Jobs | 3 | Create multiple job types |
| 9 | List Jobs | 3 | Pagination, filtering, search |
| 10 | Job Details | 3 | Individual job retrieval |
| 11 | My Jobs | 2 | Employer's jobs list |
| 12 | Matched Jobs | 3 | AI matching, similarity scores |
| 13 | Apply to Job | 2 | Application submission, duplicates |
| 14 | My Applications | 3 | Candidate's applications |
| 15 | Job Applications | 2 | Employer view |
| 16 | Update Status | 2 | Modify application status |
| 17 | Matching Score | 3 | Detailed match analysis |
| 18 | Update Job | 2 | Modify job postings |
| 19 | Authorization | 3 | Role-based access control |
| 20 | Token Refresh | 2 | JWT token refresh |
| 21 | Change Password | 2 | Password updates |

**Total: 60+ individual test assertions**

## 🎯 Expected Output

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║        SKILLBRIDGE COMPREHENSIVE TEST SUITE                        ║
║        AI-Powered Job Matching Platform                            ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

Starting comprehensive tests...
Target: http://localhost:5000

======================================================================
TEST 1: HEALTH CHECK
======================================================================

✓ PASS - Health check endpoint
✓ PASS - Service name correct

======================================================================
TEST 2: USER REGISTRATION
======================================================================

✓ PASS - Register candidate 1
✓ PASS - Register candidate 2
✓ PASS - Register employer 1
✓ PASS - Duplicate registration rejected

[... more tests ...]

======================================================================
TEST SUMMARY
======================================================================
Total Tests: 60+
Passed: 60+
Failed: 0

Success Rate: 100.0%
======================================================================

╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║                  ✓ ALL TESTS PASSED! 🎉                           ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

## 🔧 Prerequisites

Before running tests, ensure:

1. **Flask server is running:**
   ```bash
   python app.py
   ```

2. **All databases are up:**
   - PostgreSQL (port 5432)
   - MongoDB (port 27017)
   - Redis (port 6379)
   - Qdrant (port 6333)

3. **Dependencies installed:**
   ```bash
   pip install requests
   ```

4. **Sample resumes exist:**
   ```bash
   ls sample_resumes/*.pdf
   ```

## 🚨 Troubleshooting

### Server Not Running
```
ERROR: Cannot connect to http://localhost:5000
```
**Fix:** Start Flask server: `python app.py`

### Missing Resume Files
```
FAIL - Resume upload - Resume file not found
```
**Fix:** Convert sample resumes:
```bash
python scripts/convert_md_to_txt.py
cd sample_resumes
libreoffice --headless --convert-to pdf *.txt --outdir .
```

### Database Errors
```
FAIL - Register candidate 1 - Status: 500
```
**Fix:** Check database services:
```bash
sudo systemctl status postgresql
sudo systemctl status mongodb
redis-cli ping
curl http://localhost:6333/
```

### Import Errors
```
ModuleNotFoundError: No module named 'requests'
```
**Fix:** Install dependencies:
```bash
pip install requests
```

## 📁 Test Files

```
backend/
├── tests/
│   ├── comprehensive_test.py    # Main test suite
│   ├── test_api.py              # Unit tests
│   └── README.md                # Test documentation
├── run_tests.sh                 # Test runner script
└── TESTING_GUIDE.md             # This file
```

## 🎨 Test Features

### Color-Coded Output
- 🟢 **Green** = Test passed
- 🔴 **Red** = Test failed
- 🟡 **Yellow** = Warnings/Info
- 🔵 **Blue** = Section headers

### Detailed Reporting
- Individual test results
- Failed test summary with reasons
- Overall statistics
- Success percentage

### Automatic Cleanup
- Uses `@test.com` emails (easy to identify)
- Test data clearly marked
- No manual cleanup needed

## 🧪 Manual Testing

If you want to test manually:

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "role": "candidate",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 3. Upload Resume
```bash
# Save the token from login response
TOKEN="your-access-token-here"

curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample_resumes/john_doe_resume.pdf"
```

### 4. Get Matched Jobs
```bash
curl http://localhost:5000/api/matching/jobs \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Test Data Used

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Candidate | john.candidate@test.com | TestPass123! |
| Candidate | mary.candidate@test.com | TestPass123! |
| Employer | hr@testcompany.com | TestPass123! |

### Test Jobs Created
1. **Senior Software Engineer**
   - Location: Nairobi
   - Skills: Python, JavaScript, AWS, Docker, PostgreSQL
   - Salary: KES 150,000 - 250,000

2. **Junior Full Stack Developer**
   - Location: Nairobi
   - Skills: JavaScript, React, Node.js, MongoDB
   - Salary: KES 80,000 - 120,000

3. **Data Scientist**
   - Location: Nairobi
   - Skills: Python, Machine Learning, TensorFlow, SQL
   - Salary: KES 120,000 - 180,000

### Test Resume
- **File:** `sample_resumes/john_doe_resume.pdf`
- **Contains:** Python, JavaScript, AWS, Docker, ML skills
- **Should match:** Senior Software Engineer job (high score)

## ✅ Success Criteria

Tests pass if:
- ✅ All 21 test categories complete
- ✅ 60+ assertions pass
- ✅ Success rate ≥ 95%
- ✅ No authorization bypasses
- ✅ AI parsing extracts skills correctly
- ✅ Matching returns relevant jobs

## 🎯 What This Tests

### Backend Functionality
- ✅ RESTful API endpoints
- ✅ Authentication & authorization
- ✅ Database operations (CRUD)
- ✅ File upload handling
- ✅ Input validation
- ✅ Error handling

### AI/ML Features
- ✅ Gemini AI resume parsing
- ✅ Skill extraction accuracy
- ✅ Vector embedding generation
- ✅ Similarity search (Qdrant)
- ✅ Job matching algorithm
- ✅ Score calculation

### Security
- ✅ JWT token generation
- ✅ Token validation
- ✅ Password hashing
- ✅ Role-based access
- ✅ Unauthorized access prevention

### Business Logic
- ✅ User registration flow
- ✅ Resume upload & parsing
- ✅ Job posting creation
- ✅ Application submission
- ✅ Status updates
- ✅ Employer-candidate interaction

## 🚀 Next Steps After Tests Pass

1. **Review Results:**
   - Check any warnings
   - Review match scores
   - Verify parsed resume data

2. **Test Edge Cases:**
   - Invalid file formats
   - Very long resumes
   - Special characters
   - Multiple applications

3. **Performance Testing:**
   - Load testing with many users
   - Concurrent resume uploads
   - Stress test matching algorithm

4. **Integration Testing:**
   - Full user journey
   - Multi-user scenarios
   - Real-world workflows

5. **Prepare for Production:**
   - Set up monitoring
   - Configure logging
   - Enable rate limiting
   - Add API documentation

## 📚 Additional Resources

- **Test Documentation:** `tests/README.md`
- **API Documentation:** `docs/API_DOCUMENTATION.md`
- **Quick Start:** `docs/QUICKSTART.md`
- **Main README:** `README.md`

---

**Happy Testing! 🧪 Let's ensure SkillBridge works perfectly!**
