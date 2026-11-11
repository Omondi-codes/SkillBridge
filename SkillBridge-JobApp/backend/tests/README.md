# SkillBridge Test Suite

Comprehensive testing suite for the SkillBridge backend.

## 📋 Test Overview

The comprehensive test suite covers:

### 21 Test Categories

1. **Health Check** - Verify server is running
2. **User Registration** - Register candidates, employers, and test validation
3. **User Login** - Test authentication and error handling
4. **Get Current User** - Verify token-based authentication
5. **Update Profile** - Test profile modification
6. **Resume Upload** - Upload and parse resumes
7. **Get My Resumes** - List user's resumes
8. **Create Jobs** - Create multiple job postings
9. **List Jobs** - Test job listing and filtering
10. **Get Job Details** - Retrieve individual job information
11. **Get My Jobs** - Employer's job listings
12. **Get Matched Jobs** - AI-powered job matching for candidates
13. **Apply to Job** - Submit job applications
14. **Get My Applications** - Candidate's applications
15. **Get Job Applications** - Employer view of applications
16. **Update Application Status** - Modify application status
17. **Get Matching Score** - Detailed matching analysis
18. **Update Job** - Modify job postings
19. **Authorization** - Test role-based access control
20. **Token Refresh** - JWT token refresh mechanism
21. **Change Password** - Password update functionality

## 🚀 Quick Start

### Prerequisites

1. **Start the Flask server:**
   ```bash
   python app.py
   ```

2. **Ensure all services are running:**
   - PostgreSQL
   - MongoDB
   - Redis
   - Qdrant

### Run Tests

#### Option 1: Using the runner script (Recommended)
```bash
./run_tests.sh
```

#### Option 2: Direct Python execution
```bash
python3 tests/comprehensive_test.py
```

#### Option 3: Run from anywhere
```bash
cd /path/to/backend
python3 tests/comprehensive_test.py
```

## 📊 Test Coverage

The comprehensive test suite tests:

- ✅ **26 API endpoints**
- ✅ **User registration and authentication**
- ✅ **Resume upload and parsing**
- ✅ **Job creation and management**
- ✅ **AI-powered job matching**
- ✅ **Application workflow**
- ✅ **Role-based access control**
- ✅ **Token management**
- ✅ **Error handling**
- ✅ **Input validation**

## 📝 Test Data

The test suite:
- Creates 2 candidates
- Creates 1 employer
- Uploads 1 resume (uses sample_resumes/)
- Creates 3 job postings
- Submits 1 job application
- Tests various filters and searches

All test data uses `@test.com` emails and is clearly marked as test data.

## 🎯 Expected Results

A successful test run should show:

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║        SKILLBRIDGE COMPREHENSIVE TEST SUITE                        ║
║        AI-Powered Job Matching Platform                            ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

✓ PASS - Health check endpoint
✓ PASS - Service name correct
✓ PASS - Register candidate 1
✓ PASS - Register candidate 2
...
[Additional tests]
...

==================================================================
TEST SUMMARY
==================================================================
Total Tests: 60+
Passed: 60+
Failed: 0

Success Rate: 100.0%
==================================================================
```

## 🔧 Troubleshooting

### Server Not Running
```
ERROR: Cannot connect to http://localhost:5000
Please start the Flask server: python app.py
```

**Solution:** Start the Flask server in another terminal

### Missing Dependencies
```
ModuleNotFoundError: No module named 'requests'
```

**Solution:** Install requests library
```bash
pip install requests
```

### Resume File Not Found
```
FAIL - Resume upload - Resume file not found
```

**Solution:** Ensure sample resumes exist
```bash
ls sample_resumes/*.pdf
# If not, convert them:
python scripts/convert_md_to_txt.py
cd sample_resumes && libreoffice --headless --convert-to pdf *.txt --outdir .
```

### Database Connection Errors
```
FAIL - Register candidate 1 - Status: 500
```

**Solution:** Verify all services are running:
```bash
# PostgreSQL
sudo systemctl status postgresql

# MongoDB
sudo systemctl status mongodb

# Redis
redis-cli ping  # Should return PONG

# Qdrant
curl http://localhost:6333/  # Should return JSON
```

## 📈 Understanding Test Results

### Test Output Format

Each test shows:
```
✓ PASS - Test name                    # Successful test
✗ FAIL - Test name                    # Failed test
  └─ Error message                     # Failure details
```

### Test Summary

Shows overall statistics:
- **Total Tests:** Number of assertions checked
- **Passed:** Successful tests
- **Failed:** Failed tests with details
- **Success Rate:** Percentage of passing tests

## 🧪 Writing Custom Tests

To add new tests to the comprehensive suite:

1. **Create a test function:**
   ```python
   def test_my_feature():
       print_header("TEST N: MY FEATURE")

       response = make_request('GET', '/my-endpoint', token=token)

       if response and response.status_code == 200:
           tracker.add_test("My feature works", True)
       else:
           tracker.add_test("My feature works", False)
   ```

2. **Add to test runner:**
   ```python
   def run_all_tests():
       # ... existing tests ...
       test_my_feature()
   ```

## 🎨 Test Features

### Color-Coded Output
- 🟢 **Green** - Passed tests
- 🔴 **Red** - Failed tests
- 🟡 **Yellow** - Warnings and info
- 🔵 **Blue** - Section headers

### Detailed Reporting
- Individual test results
- Failed test summary
- Overall success rate
- Error messages for debugging

### Test Data Management
- Automatic test account creation
- Cleanup not required (use test emails)
- Reusable test data across tests

## 📚 Test Categories Explained

### Authentication Tests
- User registration validation
- Login/logout flow
- Token generation
- Password security
- Duplicate prevention

### Resume Tests
- File upload (PDF, TXT)
- Gemini AI parsing
- Skill extraction
- Vector embedding generation
- Resume retrieval

### Job Tests
- Job creation
- Listing and filtering
- Search functionality
- Job updates
- Employer management

### Matching Tests
- AI-powered matching algorithm
- Similarity scores
- Skill matching
- Location matching
- Experience matching

### Application Tests
- Job application submission
- Application status tracking
- Employer reviews
- Candidate notifications

### Authorization Tests
- Role-based access control
- Candidate permissions
- Employer permissions
- Unauthorized access prevention

## 🔍 Debugging Failed Tests

1. **Check server logs:**
   ```bash
   # Server terminal will show detailed error messages
   ```

2. **Run individual tests:**
   ```python
   # Comment out other tests in run_all_tests()
   # to isolate the failing test
   ```

3. **Check test data:**
   ```python
   # Add print statements to inspect test_data dict
   print(json.dumps(test_data, indent=2))
   ```

4. **Verify database state:**
   ```bash
   # PostgreSQL
   psql -U postgres -d skillbridge -c "SELECT * FROM users;"

   # MongoDB
   mongo skillbridge --eval "db.resumes.find().pretty()"

   # Qdrant
   curl http://localhost:6333/collections
   ```

## 🚀 Continuous Integration

To use in CI/CD:

```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start services
        run: docker-compose up -d
      - name: Run tests
        run: ./run_tests.sh
```

## 📊 Success Criteria

Tests are considered successful if:
- ✅ Success rate ≥ 95%
- ✅ All critical paths work (auth, upload, match, apply)
- ✅ No authorization bypasses
- ✅ AI parsing extracts skills
- ✅ Matching returns relevant results

## 🎯 Next Steps

After tests pass:
1. Review any warnings
2. Check test coverage for new features
3. Add integration tests for complex workflows
4. Set up automated testing in CI/CD
5. Monitor production with similar health checks

---

**Happy Testing! 🧪**

For issues or questions, check the main documentation in `docs/`
