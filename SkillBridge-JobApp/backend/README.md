# SkillBridge Backend

AI-powered job matching platform backend using Google Gemini and Qdrant vector database.

## 📚 Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started in minutes
- **[Getting Started Checklist](docs/GETTING_STARTED_CHECKLIST.md)** - Step-by-step setup
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- **[Project Summary](docs/PROJECT_SUMMARY.md)** - Comprehensive overview

## Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Copy environment file
cp .env.example .env
# Edit .env with your credentials
```

### 2. Setup Databases

```bash
# Start PostgreSQL (ensure it's running)
# Create database
createdb skillbridge

# Start MongoDB (ensure it's running)

# Start Qdrant with Docker
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

# Or install Qdrant locally

# Start Redis
redis-server
```

### 3. Initialize Database

```bash
# Run migrations
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Initialize Qdrant collections
python scripts/init_qdrant.py

# Seed sample data (optional)
python scripts/seed_database.py
```

### 4. Run Application

```bash
# Start Flask development server
python app.py

# In another terminal, start Celery worker
celery -A celery_app worker --loglevel=info

# In another terminal, start Celery beat (for scheduled tasks)
celery -A celery_app beat --loglevel=infoelery -A celery_app worker --loglevel=info
elery -A celery_app worker --loglevel=info

```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `POST /api/auth/change-password` - Change password

### Resumes
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes/<id>` - Get resume
- `PUT /api/resumes/<id>` - Update resume
- `DELETE /api/resumes/<id>` - Delete resume
- `GET /api/resumes/my-resumes` - Get all user resumes

### Jobs
- `POST /api/jobs` - Create job (Employer)
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/<id>` - Get job details
- `PUT /api/jobs/<id>` - Update job
- `DELETE /api/jobs/<id>` - Delete job
- `GET /api/jobs/my-jobs` - Get employer's jobs
- `POST /api/jobs/<id>/close` - Close job

### Matching
- `GET /api/matching/jobs` - Get matched jobs (Candidate)
- `GET /api/matching/candidates?job_id=<id>` - Get matched candidates (Employer)
- `POST /api/matching/apply` - Apply to job
- `GET /api/matching/applications` - Get candidate applications
- `GET /api/matching/job/<id>/applications` - Get job applications
- `PUT /api/matching/application/<id>` - Update application status
- `POST /api/matching/score` - Get matching score

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `GOOGLE_API_KEY` - Google Gemini API key
- `DATABASE_URL` - PostgreSQL connection string
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `QDRANT_HOST` - Qdrant host
- `JWT_SECRET_KEY` - JWT secret key

## Testing

```bash
# Run tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=. --cov-report=html
```

## Deployment

### Using Docker

```bash
# Build image
docker build -t skillbridge-backend .

# Run container
docker run -p 5000:5000 --env-file .env skillbridge-backend
```

### Using Docker Compose

```bash
docker-compose up -d
```

## Architecture

- **Flask** - Web framework
- **Google Gemini** - AI-powered resume parsing and understanding
- **Qdrant** - Vector database for similarity search
- **PostgreSQL** - Relational data (users, jobs, applications)
- **MongoDB** - Document storage (resume text, job descriptions)
- **Redis** - Caching and Celery message broker
- **Celery** - Asynchronous task processing

## Project Structure

```
backend/
├── api/              # API endpoints
├── models/           # Database models
├── services/         # Business logic
├── tasks/            # Celery tasks
├── utils/            # Utilities
├── scripts/          # Utility scripts
├── app.py            # Flask application
├── config.py         # Configuration
└── requirements.txt  # Dependencies
```

## License

MIT License
