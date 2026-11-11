import os
import sys
from datetime import datetime, timedelta
import uuid
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/skillbridge')
client = MongoClient(MONGODB_URI)
db = client.get_database()

def create_employer_and_job():
    """Create an employer user and a job posting"""

    # Employer credentials
    employer_email = "employer@techvision.com"
    employer_password = "Employer123!"
    employer_id = str(uuid.uuid4())

    print("Creating employer account...")
    print("=" * 80)

    # Check if employer already exists
    existing = db.users.find_one({'email': employer_email})
    if existing:
        print(f"⚠️  Employer already exists with email: {employer_email}")
        employer_id = existing['id']
    else:
        # Create employer user
        employer = {
            'id': employer_id,
            'email': employer_email,
            'password_hash': generate_password_hash(employer_password),
            'role': 'employer',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'company_name': 'TechVision Solutions',
            'company_website': 'https://techvision.com',
            'company_size': '50-200',
            'industry': 'Technology',
            'is_verified': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'profile': {
                'phone': '+254 700 123 456',
                'location': 'Nairobi, Kenya',
                'description': 'TechVision Solutions is a leading software development company in East Africa.'
            }
        }

        db.users.insert_one(employer)
        print(f"✅ Created employer account: {employer_email}")

    print("\nCreating job posting...")
    print("-" * 80)

    # Create a new job posting
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "title": "Senior Backend Developer",
        "company_name": "TechVision Solutions",
        "company_logo": None,
        "description": "We are looking for an experienced Senior Backend Developer to join our growing engineering team. You will be responsible for designing and implementing scalable backend services, APIs, and microservices architecture.",
        "responsibilities": [
            "Design and develop RESTful APIs and microservices",
            "Architect scalable backend systems using modern technologies",
            "Optimize database queries and application performance",
            "Lead code reviews and mentor junior developers",
            "Collaborate with frontend developers and DevOps team",
            "Implement security best practices and data protection measures",
            "Write comprehensive tests and documentation"
        ],
        "required_skills": ["Python", "Django", "PostgreSQL", "Redis", "Docker", "Git"],
        "preferred_skills": ["AWS", "Kubernetes", "GraphQL", "Celery", "Elasticsearch"],
        "employment_type": "full-time",
        "location": "Nairobi, Kenya",
        "remote_allowed": True,
        "salary_min": 180000,
        "salary_max": 280000,
        "salary_currency": "KES",
        "experience_level": "senior",
        "experience_years": 5,
        "education_level": "Bachelor's Degree in Computer Science or related field",
        "category": "Software Development",
        "benefits": [
            "Competitive salary with performance bonuses",
            "Comprehensive health insurance for you and your family",
            "Flexible working hours and remote work options",
            "Professional development and training budget",
            "Latest MacBook Pro and development tools",
            "Annual team building retreats",
            "Stock options after 1 year",
            "Gym membership and wellness programs"
        ],
        "positions_available": 2,
        "application_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
        "status": "active",
        "employer_id": employer_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 0,
        "views_count": 0
    }

    db.jobs.insert_one(job)
    print(f"✅ Created job posting: {job['title']}")

    print("\n" + "=" * 80)
    print("EMPLOYER LOGIN CREDENTIALS")
    print("=" * 80)
    print(f"Email:    {employer_email}")
    print(f"Password: {employer_password}")
    print(f"Role:     employer")
    print("=" * 80)

    print("\nJOB DETAILS")
    print("-" * 80)
    print(f"Job ID:       {job_id}")
    print(f"Title:        {job['title']}")
    print(f"Company:      {job['company_name']}")
    print(f"Location:     {job['location']}")
    print(f"Type:         {job['employment_type']}")
    print(f"Salary:       {job['salary_currency']} {job['salary_min']:,} - {job['salary_max']:,}")
    print(f"Experience:   {job['experience_years']} years ({job['experience_level']})")
    print(f"Remote:       {'Yes' if job['remote_allowed'] else 'No'}")
    print(f"\nRequired Skills:")
    for skill in job['required_skills']:
        print(f"  • {skill}")
    print(f"\nPreferred Skills:")
    for skill in job['preferred_skills']:
        print(f"  • {skill}")
    print("-" * 80)

    print("\n✅ Setup completed successfully!")
    print("\nYou can now:")
    print("1. Login as employer at: http://localhost:3000/login")
    print("2. View the job posting at: http://localhost:3000/candidate/jobs")
    print("3. Apply to the job as a candidate with your resume")

    return {
        'employer_email': employer_email,
        'employer_password': employer_password,
        'employer_id': employer_id,
        'job_id': job_id
    }

if __name__ == "__main__":
    try:
        result = create_employer_and_job()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
