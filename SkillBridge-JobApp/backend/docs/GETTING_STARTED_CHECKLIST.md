# SkillBridge Backend - Getting Started Checklist

Use this checklist to get your SkillBridge backend up and running!

## ✅ Pre-Installation Checklist

- [ ] Python 3.9+ installed (`python3 --version`)
- [ ] PostgreSQL 14+ installed and running
- [ ] MongoDB 5.0+ installed and running
- [ ] Redis 6.2+ installed and running
- [ ] Docker installed (for Qdrant)
- [ ] Git installed
- [ ] Text editor/IDE ready

## ✅ Installation Steps

### Step 1: Environment Setup
- [ ] Navigate to backend directory: `cd /home/lnx/Desktop/biggies/v2/backend`
- [ ] Create virtual environment: `python3 -m venv venv`
- [ ] Activate virtual environment: `source venv/bin/activate`
- [ ] Upgrade pip: `pip install --upgrade pip`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Download spaCy model: `python -m spacy download en_core_web_sm`

### Step 2: Configure Environment
- [ ] Review `.env` file (already created with Gemini API key)
- [ ] Update `DATABASE_URL` with PostgreSQL credentials
- [ ] Update `MONGODB_URI` if needed
- [ ] Update `REDIS_URL` if needed
- [ ] Verify `GOOGLE_API_KEY` is set: `AIzaSyCNXxGChJzeF8FACs1IEml9d_4HX18GuHU`

### Step 3: Database Setup

#### PostgreSQL
- [ ] Create database: `createdb skillbridge`
- [ ] Or via psql: `psql -U postgres -c "CREATE DATABASE skillbridge;"`
- [ ] Verify connection: `psql -U postgres -d skillbridge -c "SELECT version();"`

#### MongoDB
- [ ] Start MongoDB service: `sudo systemctl start mongodb` (or `mongod`)
- [ ] Verify it's running: `mongo --eval "db.version()"`

#### Redis
- [ ] Start Redis server: `redis-server` (or `sudo systemctl start redis`)
- [ ] Verify it's running: `redis-cli ping` (should return PONG)

#### Qdrant
- [ ] Start Qdrant: `docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant`
- [ ] Verify it's running: `curl http://localhost:6333/` (should return JSON)

### Step 4: Initialize Application
- [ ] Set Flask app: `export FLASK_APP=app.py`
- [ ] Initialize migrations: `flask db init`
- [ ] Create migration: `flask db migrate -m "Initial migration"`
- [ ] Apply migrations: `flask db upgrade`
- [ ] Initialize Qdrant collections: `python scripts/init_qdrant.py`
- [ ] (Optional) Seed sample data: `python scripts/seed_database.py`

### Step 5: Run Application

#### Terminal 1: Flask Application
- [ ] Activate venv: `source venv/bin/activate`
- [ ] Run app: `python app.py`
- [ ] Verify running: Visit `http://localhost:5000/health`

#### Terminal 2: Celery Worker
- [ ] Activate venv: `source venv/bin/activate`
- [ ] Run worker: `celery -A celery_app worker --loglevel=info`
- [ ] Verify worker is ready (see output)

#### Terminal 3: Celery Beat (Optional)
- [ ] Activate venv: `source venv/bin/activate`
- [ ] Run beat: `celery -A celery_app beat --loglevel=info`

## ✅ Verification Tests

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```
- [ ] Returns `{"status": "healthy"}`

### Test 2: Root Endpoint
```bash
curl http://localhost:5000/
```
- [ ] Returns welcome message with API info

### Test 3: Register User
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
- [ ] Returns 201 status
- [ ] Returns user data and tokens

### Test 4: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```
- [ ] Returns 200 status
- [ ] Returns access_token

### Test 5: List Jobs
```bash
curl http://localhost:5000/api/jobs
```
- [ ] Returns 200 status
- [ ] Returns jobs array (empty if not seeded)

## ✅ Optional: Using Sample Data

If you ran the seed script:

### Test Login with Sample Credentials
- [ ] Admin: `admin@skillbridge.co.ke` / `Admin123!`
- [ ] Employer: `hr@safaricom.co.ke` / `Employer123!`
- [ ] Candidate: `omondi@example.com` / `Candidate123!`

### Verify Sample Data
- [ ] Check jobs: `curl http://localhost:5000/api/jobs`
- [ ] Should see 3 sample jobs

## ✅ Testing with Postman/Insomnia

- [ ] Import API collection (create from API_DOCUMENTATION.md)
- [ ] Test authentication flow
- [ ] Test resume upload with a sample PDF
- [ ] Test job creation
- [ ] Test matching endpoints

## ✅ Development Workflow

- [ ] Code changes auto-reload in development mode
- [ ] Check logs in terminal for errors
- [ ] Use `flask db migrate` after model changes
- [ ] Run tests: `pytest tests/ -v`

## ✅ Troubleshooting Checks

If something doesn't work:

### Database Connection Issues
- [ ] PostgreSQL running: `sudo systemctl status postgresql`
- [ ] MongoDB running: `sudo systemctl status mongodb`
- [ ] Redis running: `sudo systemctl status redis`
- [ ] Qdrant running: `docker ps | grep qdrant`

### Port Conflicts
- [ ] Port 5000 free: `lsof -i :5000`
- [ ] Port 5432 free (PostgreSQL): `lsof -i :5432`
- [ ] Port 27017 free (MongoDB): `lsof -i :27017`
- [ ] Port 6379 free (Redis): `lsof -i :6379`
- [ ] Port 6333 free (Qdrant): `lsof -i :6333`

### Environment Issues
- [ ] Virtual environment activated: `which python` (should show venv path)
- [ ] Dependencies installed: `pip list | grep Flask`
- [ ] .env file exists and has correct values

### API Issues
- [ ] Check Flask logs in terminal
- [ ] Check Celery worker logs
- [ ] Verify database migrations: `flask db current`
- [ ] Check Qdrant: `curl http://localhost:6333/collections`

## ✅ Next Steps After Setup

- [ ] Read API_DOCUMENTATION.md for API details
- [ ] Try uploading a real resume (PDF)
- [ ] Create a job posting as employer
- [ ] Test the matching algorithm
- [ ] Review code in `services/` for AI logic
- [ ] Customize skills in resume_parser.py
- [ ] Adjust matching weights in job_matcher.py

## ✅ Production Deployment

When ready for production:

- [ ] Review DEPLOYMENT.md
- [ ] Update SECRET_KEY and JWT_SECRET_KEY in .env
- [ ] Set FLASK_ENV=production
- [ ] Use production database URLs
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Review security checklist in DEPLOYMENT.md

## 📞 Need Help?

- [ ] Check README.md for overview
- [ ] Review QUICKSTART.md for detailed setup
- [ ] See API_DOCUMENTATION.md for API reference
- [ ] Check logs for error messages
- [ ] Verify all services are running

## 🎉 Success Indicators

You're ready when:
- ✅ Health endpoint returns healthy status
- ✅ Can register and login users
- ✅ Can upload and parse resumes
- ✅ Can create and list jobs
- ✅ Matching algorithm returns results
- ✅ All tests pass
- ✅ No errors in logs

---

**Congratulations! Your SkillBridge backend is ready! 🚀**

Now you can:
1. Connect your frontend
2. Test with real data
3. Deploy to production
4. Start revolutionizing job matching in Kenya! 🇰🇪
