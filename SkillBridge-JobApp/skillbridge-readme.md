### 2. Core Services Configuration

#### Resume Parser Service
- Uses **Google Gemini API** for intelligent text understanding and entity extraction
- Employs **sentence-transformers** to generate embeddings
- Stores vectors in **Qdrant** for similarity search
- Fallback to spaCy for basic NLP if Gemini is unavailable

#### Vector Storage with Qdrant
- Stores resume embeddings (768-dimensional vectors)
- Enables fast similarity search for job matching
- Supports metadata filtering for skill-based queries
- Scales horizontally for millions of vectors

#### Job Matching Service
- Uses Qdrant's similarity search for initial matching
- Applies collaborative filtering for ranking
- Leverages Gemini for understanding job requirements
- Returns top matches with explanation scores# SkillBridge: AI-Powered Job Matching Platform

An intelligent web-based recruitment platform leveraging Google Gemini AI and vector similarity search to revolutionize job matching in Kenya's employment market.

## 🎯 Project Overview

SkillBridge addresses critical inefficiencies in Kenya's recruitment ecosystem by:
- **Reducing application rejection rates** from 88% to under 15% through intelligent resume parsing
- **Improving job-candidate matching** by 70% compared to traditional keyword-based systems
- **Accelerating hiring processes** from 6-8 weeks to under 2 weeks
- **Supporting multilingual processing** for English and Kiswahili content

### Key Features
- 🤖 AI-powered resume parsing using Google Gemini
- 🎯 Vector similarity search with Qdrant for intelligent matching
- 📱 Mobile-optimized responsive design
- 🔐 Secure role-based access control
- 📊 Real-time analytics and reporting
- 🌍 Multilingual support (English/Kiswahili)

## 🛠️ Technology Stack

### Backend
- **Flask** (Python 3.9+) - Web framework
- **SQLAlchemy** - ORM for database management
- **Celery** - Asynchronous task processing
- **Redis** - Caching and message broker
- **Flask-JWT-Extended** - Authentication & authorization
- **Flask-CORS** - Cross-origin resource sharing

### AI/ML Stack
- **Google Gemini API** - Advanced language model for parsing and understanding
- **Vertex AI** - Google's ML platform for model deployment
- **TensorFlow 2.x** - Deep learning framework
- **scikit-learn** - Traditional ML algorithms
- **sentence-transformers** - Generate embeddings
- **spaCy** - Text preprocessing
- **Pandas/NumPy** - Data manipulation

### Frontend
- **React.js 18.x** - UI framework
- **Redux Toolkit** - State management
- **Material-UI** - Component library
- **Axios** - HTTP client
- **React Router v6** - Navigation

### Database
- **PostgreSQL** - Primary relational database
- **Qdrant** - Vector database for embeddings and similarity search
- **MongoDB** - Document storage for resumes/jobs
- **Redis** - Session management and caching

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **AWS/Azure** - Cloud deployment
- **GitHub Actions** - CI/CD pipeline

## 📦 Installation

### Prerequisites
```bash
# System requirements
Python 3.9+
Node.js 16+
PostgreSQL 14+
MongoDB 5.0+
Redis 6.2+
Docker 20+ (for Qdrant)
```

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/skillbridge.git
cd skillbridge
```

### 2. Backend Setup

#### Create Python Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### requirements.txt
```txt
# Core Flask
Flask==2.3.0
Flask-SQLAlchemy==3.0.0
Flask-Migrate==4.0.0
Flask-JWT-Extended==4.5.0
Flask-CORS==4.0.0
Flask-RESTful==0.3.10
Flask-Mail==0.9.1

# Database
psycopg2-binary==2.9.7
pymongo==4.5.0
redis==5.0.0
qdrant-client==1.7.0
SQLAlchemy==2.0.0

# AI/ML with Google Gemini
google-generativeai==0.3.2
google-cloud-aiplatform==1.38.0
vertexai==1.38.0
tensorflow==2.14.0
scikit-learn==1.3.0
sentence-transformers==2.2.2
spacy==3.6.0
pandas==2.1.0
numpy==1.24.0

# Task Queue
celery==5.3.0
celery[redis]

# Utilities
python-dotenv==1.0.0
marshmallow==3.20.0
gunicorn==21.2.0
pytest==7.4.0
black==23.9.0
Pillow==10.1.0
PyPDF2==3.0.1
python-docx==1.1.0
```

#### Environment Configuration
Create `.env` file in project root:
```env
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# Database URLs
DATABASE_URL=postgresql://user:password@localhost:5432/skillbridge
MONGODB_URI=mongodb://localhost:27017/skillbridge
REDIS_URL=redis://localhost:6379/0

# Qdrant Vector Database
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_API_KEY=your-qdrant-api-key  # Optional for local
QDRANT_COLLECTION_NAME=skillbridge_vectors

# Google Gemini Configuration
GOOGLE_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1

# Embedding Model Configuration
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
EMBEDDING_DIMENSION=768
MAX_SEQUENCE_LENGTH=512

# AWS Configuration (for production)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=skillbridge-uploads

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 3. Database Setup

#### PostgreSQL Initialization
```bash
# Create database
createdb skillbridge

# Run migrations
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

#### MongoDB Setup
```bash
# Start MongoDB service
mongod --dbpath /path/to/data/directory

# Create collections (automatic on first insert)
```

#### Qdrant Vector Database Setup
```bash
# Start Qdrant using Docker
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant

# Or install locally
pip install qdrant-client

# Initialize collections in Python
python scripts/init_qdrant.py
```

Example Qdrant initialization script:
```python
# scripts/init_qdrant.py
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(host="localhost", port=6333)

# Create collection for resume vectors
client.recreate_collection(
    collection_name="resumes",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)

# Create collection for job vectors
client.recreate_collection(
    collection_name="jobs",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)

print("Qdrant collections created successfully")
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run build  # For production
npm start      # For development
```

## 📁 Project Structure

```
skillbridge/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config.py              # Configuration management
│   ├── requirements.txt       # Python dependencies
│   ├── api/                   # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── jobs.py           # Job management endpoints
│   │   ├── resumes.py        # Resume processing endpoints
│   │   ├── matching.py       # Job matching endpoints
│   │   └── users.py          # User management endpoints
│   ├── models/               # Database models
│   │   ├── __init__.py
│   │   ├── user.py          # User model
│   │   ├── job.py           # Job posting model
│   │   ├── resume.py        # Resume model
│   │   └── application.py   # Job application model
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── resume_parser.py # BERT-based parsing
│   │   ├── job_matcher.py   # Collaborative filtering
│   │   └── notification.py  # Email/SMS notifications
│   ├── ml/                  # Machine learning modules
│   │   ├── __init__.py
│   │   ├── bert_model.py    # BERT implementation
│   │   ├── skill_extractor.py
│   │   ├── matcher.py       # Matching algorithms
│   │   └── trainer.py       # Model training scripts
│   ├── utils/               # Utility functions
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── decorators.py
│   │   └── helpers.py
│   └── tests/               # Test suite
│       ├── __init__.py
│       ├── test_api.py
│       ├── test_models.py
│       └── test_ml.py
├── frontend/                # React application
│   ├── src/
│   ├── public/
│   └── package.json
├── scripts/                 # Utility scripts
│   ├── seed_database.py
│   ├── train_models.py
│   └── deploy.sh
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 Core Implementation

### 1. Flask Application Setup (`app.py`)

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
import logging

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    
    # Register blueprints
    from api.auth import auth_bp
    from api.jobs import jobs_bp
    from api.resumes import resumes_bp
    from api.matching import matching_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(resumes_bp, url_prefix='/api/resumes')
    app.register_blueprint(matching_bp, url_prefix='/api/matching')
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### 2. Resume Parser Implementation (`services/resume_parser.py`)

```python
from transformers import BertTokenizer, BertModel
import torch
import spacy
from typing import Dict, List
import logging

class ResumeParser:
    def __init__(self):
        self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
        self.model = BertModel.from_pretrained('bert-base-uncased')
        self.nlp = spacy.load('en_core_web_sm')
        
    def parse_resume(self, resume_text: str) -> Dict:
        """
        Parse resume using BERT for entity extraction
        """
        # Preprocess text
        doc = self.nlp(resume_text)
        
        # Extract entities using BERT
        entities = self.extract_entities(resume_text)
        
        # Extract skills
        skills = self.extract_skills(resume_text)
        
        # Extract experience
        experience = self.extract_experience(doc)
        
        return {
            'personal_info': entities.get('personal', {}),
            'skills': skills,
            'experience': experience,
            'education': entities.get('education', []),
            'certifications': entities.get('certifications', [])
        }
    
    def extract_entities(self, text: str) -> Dict:
        # BERT-based entity extraction
        inputs = self.tokenizer(text, return_tensors='pt', 
                                max_length=512, truncation=True)
        outputs = self.model(**inputs)
        
        # Process embeddings for entity recognition
        # Implementation details here
        
        return entities
    
    def extract_skills(self, text: str) -> List[str]:
        # Skill extraction logic
        skill_patterns = [
            'python', 'java', 'javascript', 'react', 'flask',
            'machine learning', 'data analysis', 'project management'
        ]
        
        skills = []
        text_lower = text.lower()
        
        for skill in skill_patterns:
            if skill in text_lower:
                skills.append(skill)
        
        return skills
```

### 3. Job Matching Algorithm Configuration
- Utilizes Qdrant's vector similarity search
- Implements collaborative filtering for enhanced recommendations  
- Uses Google Gemini for semantic understanding of job requirements
- Generates compatibility scores based on multiple factors

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Resume Management
- `POST /api/resumes/upload` - Upload resume for parsing
- `GET /api/resumes/{id}` - Get parsed resume data
- `PUT /api/resumes/{id}` - Update resume information
- `DELETE /api/resumes/{id}` - Delete resume

### Job Management
- `POST /api/jobs` - Create job posting (Employer)
- `GET /api/jobs` - List all jobs with filters
- `GET /api/jobs/{id}` - Get job details
- `PUT /api/jobs/{id}` - Update job posting
- `DELETE /api/jobs/{id}` - Delete job posting

### Matching
- `GET /api/matching/jobs` - Get matched jobs for candidate
- `GET /api/matching/candidates` - Get matched candidates for job
- `POST /api/matching/apply` - Apply to matched job
- `GET /api/matching/score` - Get matching score details

## 🗄️ Database Schema

### PostgreSQL Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB,
    location VARCHAR(255),
    salary_range VARCHAR(100),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    candidate_id UUID REFERENCES users(id),
    resume_id UUID,
    matching_score FLOAT,
    status VARCHAR(50) DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    vector_id VARCHAR(100)  -- Reference to Qdrant vector
);
```

### MongoDB Collections

```javascript
// Resume Collection
{
  "_id": ObjectId,
  "user_id": "uuid",
  "raw_text": "string",
  "parsed_data": {
    "personal_info": {},
    "skills": [],
    "experience": [],
    "education": [],
    "certifications": []
  },
  "vector_id": "string",  // Reference to Qdrant vector
  "created_at": Date,
  "updated_at": Date
}

// Job Description Collection
{
  "_id": ObjectId,
  "job_id": "uuid",
  "full_description": "string",
  "parsed_requirements": {
    "required_skills": [],
    "preferred_skills": [],
    "experience_years": Number,
    "education_level": "string"
  },
  "vector_id": "string",  // Reference to Qdrant vector
  "created_at": Date
}
```

### Qdrant Collections

```python
# Resume Vectors Collection
{
  "collection": "resumes",
  "vector_size": 768,
  "distance": "Cosine",
  "payload": {
    "user_id": "string",
    "skills": ["array"],
    "experience_years": "number",
    "location": "string"
  }
}

# Job Vectors Collection
{
  "collection": "jobs",
  "vector_size": 768,
  "distance": "Cosine",
  "payload": {
    "job_id": "string",
    "required_skills": ["array"],
    "company": "string",
    "location": "string",
    "salary_range": "object"
  }
}
```

## 🧪 Testing

### Run Unit Tests
```bash
pytest tests/ -v --cov=backend --cov-report=html
```

### Test Coverage Requirements
- Minimum 80% code coverage
- All API endpoints tested
- Resume parsing accuracy > 85%
- Job matching relevance > 70% improvement
- Integration tests for critical paths

### Sample Test
```python
# tests/test_api.py
import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        yield client

def test_resume_upload(client, auth_headers):
    response = client.post('/api/resumes/upload',
                          data={'file': (BytesIO(b'resume content'), 'resume.pdf')},
                          headers=auth_headers,
                          content_type='multipart/form-data')
    
    assert response.status_code == 200
    assert 'parsed_data' in response.json
```

## 🚀 Deployment

### Development
```bash
# Start all services
docker-compose up -d

# Start Qdrant vector database
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

# Run Flask development server
flask run --debug

# Start Celery worker
celery -A app.celery worker --loglevel=info

# Start frontend
cd frontend && npm start
```

### Production Deployment

#### Using Docker
```bash
# Build images
docker build -f docker/Dockerfile.backend -t skillbridge-backend .
docker build -f docker/Dockerfile.frontend -t skillbridge-frontend .

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

#### AWS Deployment
```bash
# Configure AWS CLI
aws configure

# Deploy using provided script
./scripts/deploy.sh production
```

### Environment Variables for Production
```env
FLASK_ENV=production
DEBUG=False
DATABASE_URL=postgresql://prod_user:prod_pass@rds.amazonaws.com:5432/skillbridge
REDIS_URL=redis://elasticache.amazonaws.com:6379/0
```

## 🔐 Security Considerations

1. **Authentication**: JWT tokens with refresh mechanism
2. **Data Encryption**: TLS/SSL for all communications
3. **Input Validation**: Comprehensive validation on all inputs
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **GDPR Compliance**: Data anonymization and user consent
6. **Kenya Data Protection Act**: Compliance measures

## 📊 Monitoring & Analytics

- **Application Monitoring**: New Relic / DataDog
- **Error Tracking**: Sentry
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Performance Metrics**: Custom dashboard with Grafana

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Team

- **Omondi Lloyd Ludwing** - Lead Developer & Researcher

## 📞 Support

For support, email: support@skillbridge.co.ke

## 🎯 Roadmap

### Phase 1 (Months 1-2) ✅
- [x] Requirements analysis
- [x] Database design
- [x] Basic Flask API structure

### Phase 2 (Months 3-4) 🚧
- [ ] Google Gemini integration for NLP
- [ ] Resume parsing with Gemini API
- [ ] Job matching with Qdrant similarity search
- [ ] Embedding generation pipeline

### Phase 3 (Months 5-6) 📋
- [ ] Frontend development
- [ ] Testing & optimization
- [ ] Deployment preparation

### Future Enhancements
- [ ] Kiswahili language support
- [ ] Mobile applications
- [ ] Advanced analytics dashboard
- [ ] Integration with government databases

---

**Note**: This is a research project for Multimedia University of Kenya. For production deployment, ensure all security measures and compliance requirements are met.