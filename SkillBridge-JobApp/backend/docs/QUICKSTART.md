# SkillBridge Backend - Quick Start Guide

## Prerequisites

Ensure you have the following installed:
- Python 3.9 or higher
- PostgreSQL 14+
- MongoDB 5.0+
- Redis 6.2+
- Docker (for Qdrant)

## Option 1: Automatic Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

The script will:
- Create virtual environment
- Install all dependencies
- Download spaCy model
- Set up .env file
- Guide you through database setup

## Option 2: Manual Setup

### 1. Environment Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

### 2. Configure Environment Variables

The `.env` file is already created with your Gemini API key. Update other values as needed:

```bash
# Edit .env file
nano .env
```

Update these required fields:
- `DATABASE_URL` - Your PostgreSQL connection string
- `MONGODB_URI` - Your MongoDB connection string
- `REDIS_URL` - Your Redis connection string

### 3. Start Required Services

#### PostgreSQL
```bash
# Create database
createdb skillbridge

# Or using psql
psql -U postgres
CREATE DATABASE skillbridge;
\q
```

#### MongoDB
```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Or if using system service
sudo systemctl start mongodb
```

#### Redis
```bash
# Start Redis
redis-server

# Or if using system service
sudo systemctl start redis
```

#### Qdrant (Vector Database)
```bash
# Using Docker (recommended)
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

# The container will run in the foreground. Open a new terminal for next steps.
```

### 4. Initialize Database

```bash
# Run Flask migrations
export FLASK_APP=app.py
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Initialize Qdrant collections
python scripts/init_qdrant.py

# Seed database with sample data (optional)
python scripts/seed_database.py
```

### 5. Run Application

#### Terminal 1: Flask Application
```bash
source venv/bin/activate
python app.py
```

The API will be available at: `http://localhost:5000`

#### Terminal 2: Celery Worker
```bash
source venv/bin/activate
celery -A celery_app worker --loglevel=info
```

#### Terminal 3: Celery Beat (Optional - for scheduled tasks)
```bash
source venv/bin/activate
celery -A celery_app beat --loglevel=info
```

## Option 3: Docker Setup (Production-Ready)

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Register a User
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

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Upload Resume (Replace TOKEN with your JWT)
```bash
curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/resume.pdf"
```

## Sample Login Credentials (After Seeding)

If you ran the seed script, you can use these credentials:

- **Admin**: `admin@skillbridge.co.ke` / `Admin123!`
- **Employer**: `hr@safaricom.co.ke` / `Employer123!`
- **Candidate**: `omondi@example.com` / `Candidate123!`

## API Documentation

Full API documentation is available in [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Common Issues

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Database Connection Error
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env
- Verify database exists: `psql -l`

### Qdrant Connection Error
- Ensure Docker container is running: `docker ps`
- Check QDRANT_HOST and QDRANT_PORT in .env

### MongoDB Connection Error
- Ensure MongoDB is running: `sudo systemctl status mongodb`
- Check MONGODB_URI in .env

### Gemini API Error
- Verify GOOGLE_API_KEY in .env is correct
- Check API quota and billing in Google Cloud Console

## Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# View coverage report
open htmlcov/index.html
```

## Development Tips

### Hot Reload
Flask auto-reloads in development mode when files change.

### Database Migrations
After modifying models:
```bash
flask db migrate -m "Description of changes"
flask db upgrade
```

### View Logs
```bash
# Flask logs appear in terminal
# Celery logs in celery terminal

# For production (with Docker):
docker-compose logs -f backend
docker-compose logs -f celery_worker
```

### Reset Database
```bash
# Drop and recreate
flask db downgrade
flask db upgrade

# Or completely reset
dropdb skillbridge
createdb skillbridge
flask db upgrade
```

## Next Steps

1. **Frontend Integration**: Connect your React frontend to this API
2. **Add More Features**: Implement additional matching algorithms
3. **Security Hardening**: Add rate limiting, input sanitization
4. **Monitoring**: Set up APM tools (New Relic, Datadog)
5. **Testing**: Increase test coverage to 80%+

## Support

For issues or questions:
- Check [README.md](README.md)
- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- Check application logs

## License

MIT License
