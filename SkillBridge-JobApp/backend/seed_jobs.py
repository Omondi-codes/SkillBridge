import os
import sys
from datetime import datetime, timedelta
import uuid
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/skillbridge')
client = MongoClient(MONGODB_URI)
db = client.get_database()

# Sample jobs data
SAMPLE_JOBS = [
    {
        "id": str(uuid.uuid4()),
        "title": "Senior Full Stack Developer",
        "company_name": "TechVision Solutions",
        "company_logo": None,
        "description": "We are seeking a talented Senior Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.",
        "responsibilities": [
            "Design and develop scalable web applications",
            "Write clean, maintainable code following best practices",
            "Collaborate with cross-functional teams",
            "Mentor junior developers",
            "Participate in code reviews and technical discussions"
        ],
        "required_skills": ["React", "Node.js", "Python", "PostgreSQL", "Docker", "Git"],
        "preferred_skills": ["TypeScript", "AWS", "Redis", "GraphQL", "CI/CD"],
        "employment_type": "full-time",
        "location": "Nairobi, Kenya",
        "remote_allowed": True,
        "salary_min": 150000,
        "salary_max": 250000,
        "salary_currency": "KES",
        "experience_level": "senior",
        "experience_years": 5,
        "education_level": "Bachelor's Degree in Computer Science or related field",
        "category": "Software Development",
        "benefits": [
            "Competitive salary and performance bonuses",
            "Health insurance coverage",
            "Flexible working hours",
            "Remote work options",
            "Professional development budget",
            "Annual team retreats"
        ],
        "positions_available": 2,
        "application_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "status": "active",
        "employer_id": "employer-1",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 15,
        "views_count": 234
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Frontend Developer",
        "company_name": "Digital Innovators",
        "company_logo": None,
        "description": "Join our creative team as a Frontend Developer! You'll work on exciting projects building beautiful, responsive user interfaces.",
        "responsibilities": [
            "Build responsive web applications using React",
            "Implement pixel-perfect designs",
            "Optimize application performance",
            "Work closely with designers and backend developers",
            "Write unit and integration tests"
        ],
        "required_skills": ["JavaScript", "React", "HTML", "CSS", "Git"],
        "preferred_skills": ["TypeScript", "Next.js", "Tailwind CSS", "Jest", "Webpack"],
        "employment_type": "full-time",
        "location": "Nairobi, Kenya",
        "remote_allowed": True,
        "salary_min": 100000,
        "salary_max": 180000,
        "salary_currency": "KES",
        "experience_level": "mid",
        "experience_years": 3,
        "education_level": "Bachelor's Degree or equivalent experience",
        "category": "Software Development",
        "benefits": [
            "Competitive salary",
            "Health insurance",
            "Flexible hours",
            "Learning and development opportunities",
            "Modern office space"
        ],
        "positions_available": 1,
        "application_deadline": (datetime.utcnow() + timedelta(days=25)).isoformat(),
        "status": "active",
        "employer_id": "employer-1",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 8,
        "views_count": 156
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Backend Engineer",
        "company_name": "CloudScale Systems",
        "company_logo": None,
        "description": "We're looking for a Backend Engineer to build robust, scalable APIs and microservices for our cloud platform.",
        "responsibilities": [
            "Design and implement RESTful APIs",
            "Build microservices architecture",
            "Optimize database queries and performance",
            "Implement security best practices",
            "Deploy and monitor production systems"
        ],
        "required_skills": ["Python", "Django", "PostgreSQL", "Redis", "Docker"],
        "preferred_skills": ["Kubernetes", "AWS", "MongoDB", "RabbitMQ", "Elasticsearch"],
        "employment_type": "full-time",
        "location": "Mombasa, Kenya",
        "remote_allowed": False,
        "salary_min": 120000,
        "salary_max": 200000,
        "salary_currency": "KES",
        "experience_level": "mid",
        "experience_years": 4,
        "education_level": "Bachelor's Degree in Computer Science",
        "category": "Software Development",
        "benefits": [
            "Competitive compensation",
            "Medical insurance",
            "Gym membership",
            "Relocation assistance",
            "Career growth opportunities"
        ],
        "positions_available": 1,
        "application_deadline": (datetime.utcnow() + timedelta(days=20)).isoformat(),
        "status": "active",
        "employer_id": "employer-2",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 12,
        "views_count": 189
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Data Scientist",
        "company_name": "AI Innovations Ltd",
        "company_logo": None,
        "description": "Join our data science team to build machine learning models and extract insights from large datasets.",
        "responsibilities": [
            "Develop machine learning models",
            "Analyze large datasets for insights",
            "Create data visualizations and reports",
            "Collaborate with product teams",
            "Deploy ML models to production"
        ],
        "required_skills": ["Python", "Machine Learning", "SQL", "Pandas", "NumPy"],
        "preferred_skills": ["TensorFlow", "PyTorch", "Scikit-learn", "Spark", "Tableau"],
        "employment_type": "full-time",
        "location": "Nairobi, Kenya",
        "remote_allowed": True,
        "salary_min": 140000,
        "salary_max": 220000,
        "salary_currency": "KES",
        "experience_level": "mid",
        "experience_years": 3,
        "education_level": "Master's Degree in Data Science, Statistics, or related field",
        "category": "Data Science",
        "benefits": [
            "Competitive salary with equity options",
            "Comprehensive health insurance",
            "Flexible work arrangements",
            "Conference attendance budget",
            "Latest hardware and tools"
        ],
        "positions_available": 2,
        "application_deadline": (datetime.utcnow() + timedelta(days=35)).isoformat(),
        "status": "active",
        "employer_id": "employer-2",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 20,
        "views_count": 312
    },
    {
        "id": str(uuid.uuid4()),
        "title": "DevOps Engineer",
        "company_name": "InfraCloud Solutions",
        "company_logo": None,
        "description": "We need a skilled DevOps Engineer to manage our cloud infrastructure and implement CI/CD pipelines.",
        "responsibilities": [
            "Manage AWS cloud infrastructure",
            "Implement and maintain CI/CD pipelines",
            "Monitor system performance and reliability",
            "Automate deployment processes",
            "Ensure security and compliance"
        ],
        "required_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Jenkins"],
        "preferred_skills": ["Python", "Bash", "Ansible", "Prometheus", "GitLab CI"],
        "employment_type": "full-time",
        "location": "Nairobi, Kenya",
        "remote_allowed": True,
        "salary_min": 130000,
        "salary_max": 210000,
        "salary_currency": "KES",
        "experience_level": "senior",
        "experience_years": 4,
        "education_level": "Bachelor's Degree in Computer Science or related field",
        "category": "DevOps",
        "benefits": [
            "Competitive salary",
            "Health and dental insurance",
            "Remote work flexibility",
            "Professional certifications budget",
            "Stock options"
        ],
        "positions_available": 1,
        "application_deadline": (datetime.utcnow() + timedelta(days=28)).isoformat(),
        "status": "active",
        "employer_id": "employer-3",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 18,
        "views_count": 267
    },
    {
        "id": str(uuid.uuid4()),
        "title": "UI/UX Designer",
        "company_name": "Design Studio Africa",
        "company_logo": None,
        "description": "Looking for a creative UI/UX Designer to craft beautiful and intuitive user experiences for our digital products.",
        "responsibilities": [
            "Design user interfaces for web and mobile",
            "Create wireframes and prototypes",
            "Conduct user research and usability testing",
            "Collaborate with developers and stakeholders",
            "Maintain design systems and guidelines"
        ],
        "required_skills": ["Figma", "Adobe XD", "User Research", "Wireframing", "Prototyping"],
        "preferred_skills": ["Sketch", "InVision", "HTML", "CSS", "Animation"],
        "employment_type": "full-time",
        "location": "Nairobi, Kenya",
        "remote_allowed": True,
        "salary_min": 90000,
        "salary_max": 160000,
        "salary_currency": "KES",
        "experience_level": "mid",
        "experience_years": 3,
        "education_level": "Bachelor's Degree in Design or related field",
        "category": "Design",
        "benefits": [
            "Competitive salary",
            "Health insurance",
            "Creative work environment",
            "Latest design tools and software",
            "Portfolio development opportunities"
        ],
        "positions_available": 1,
        "application_deadline": (datetime.utcnow() + timedelta(days=22)).isoformat(),
        "status": "active",
        "employer_id": "employer-3",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 25,
        "views_count": 378
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Mobile App Developer (React Native)",
        "company_name": "MobileTech Kenya",
        "company_logo": None,
        "description": "Join our mobile team to build cross-platform applications using React Native.",
        "responsibilities": [
            "Develop mobile applications for iOS and Android",
            "Integrate with REST APIs and third-party services",
            "Optimize app performance",
            "Fix bugs and improve app stability",
            "Publish apps to App Store and Play Store"
        ],
        "required_skills": ["React Native", "JavaScript", "React", "Mobile Development", "Git"],
        "preferred_skills": ["TypeScript", "Redux", "Firebase", "Native Modules", "CI/CD"],
        "employment_type": "full-time",
        "location": "Nairobi, Kenya",
        "remote_allowed": True,
        "salary_min": 110000,
        "salary_max": 190000,
        "salary_currency": "KES",
        "experience_level": "mid",
        "experience_years": 3,
        "education_level": "Bachelor's Degree or equivalent experience",
        "category": "Mobile Development",
        "benefits": [
            "Competitive salary",
            "Health insurance",
            "Flexible working hours",
            "Device allowance",
            "Learning budget"
        ],
        "positions_available": 2,
        "application_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "status": "active",
        "employer_id": "employer-1",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 14,
        "views_count": 198
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Junior Software Developer",
        "company_name": "StartupHub Africa",
        "company_logo": None,
        "description": "Great opportunity for entry-level developers to learn and grow in a fast-paced startup environment.",
        "responsibilities": [
            "Assist in developing web applications",
            "Write and maintain clean code",
            "Learn from senior developers",
            "Participate in team meetings and code reviews",
            "Fix bugs and add new features"
        ],
        "required_skills": ["JavaScript", "HTML", "CSS", "Git", "Problem Solving"],
        "preferred_skills": ["React", "Node.js", "SQL", "REST APIs"],
        "employment_type": "full-time",
        "location": "Nairobi, Kenya",
        "remote_allowed": False,
        "salary_min": 60000,
        "salary_max": 100000,
        "salary_currency": "KES",
        "experience_level": "entry",
        "experience_years": 0,
        "education_level": "Bachelor's Degree in Computer Science or Bootcamp Graduate",
        "category": "Software Development",
        "benefits": [
            "Mentorship from senior developers",
            "Learning opportunities",
            "Health insurance",
            "Team lunches",
            "Career growth path"
        ],
        "positions_available": 3,
        "application_deadline": (datetime.utcnow() + timedelta(days=40)).isoformat(),
        "status": "active",
        "employer_id": "employer-1",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "posted_at": datetime.utcnow(),
        "applications_count": 45,
        "views_count": 521
    }
]

def seed_jobs():
    """Seed sample jobs into the database"""
    print("Starting job seeding...")

    # Clear existing jobs (optional)
    result = db.jobs.delete_many({})
    print(f"Cleared {result.deleted_count} existing jobs")

    # Insert sample jobs
    result = db.jobs.insert_many(SAMPLE_JOBS)
    print(f"Inserted {len(result.inserted_ids)} jobs")

    # Display seeded jobs
    print("\nSeeded Jobs:")
    print("-" * 80)
    for job in SAMPLE_JOBS:
        print(f"• {job['title']} at {job['company_name']}")
        print(f"  Location: {job['location']}")
        print(f"  Skills: {', '.join(job['required_skills'][:3])}...")
        print(f"  Salary: {job['salary_currency']} {job['salary_min']:,} - {job['salary_max']:,}")
        print()

    print("✅ Job seeding completed successfully!")

if __name__ == "__main__":
    try:
        seed_jobs()
    except Exception as e:
        print(f"❌ Error seeding jobs: {e}")
        sys.exit(1)
