#!/usr/bin/env python3
"""
Seed database with sample data for testing
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from app import create_app
from models import db, User, Job
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()


def seed_users():
    """Create sample users"""
    logger.info("Creating sample users...")

    # Create admin
    admin = User(
        email='admin@skillbridge.co.ke',
        role='admin',
        first_name='Admin',
        last_name='User',
        is_verified=True
    )
    admin.set_password('Admin123!')
    db.session.add(admin)

    # Create employers
    employers = [
        {
            'email': 'hr@safaricom.co.ke',
            'first_name': 'HR',
            'last_name': 'Manager',
            'company_name': 'Safaricom PLC',
            'company_description': 'Leading telecommunications company in Kenya',
            'company_website': 'https://www.safaricom.co.ke',
            'location': 'Nairobi'
        },
        {
            'email': 'recruiter@kcb.co.ke',
            'first_name': 'John',
            'last_name': 'Kamau',
            'company_name': 'KCB Bank Kenya',
            'company_description': 'Leading financial institution',
            'company_website': 'https://www.kcbgroup.com',
            'location': 'Nairobi'
        }
    ]

    for emp_data in employers:
        employer = User(
            email=emp_data['email'],
            role='employer',
            first_name=emp_data['first_name'],
            last_name=emp_data['last_name'],
            company_name=emp_data['company_name'],
            company_description=emp_data['company_description'],
            company_website=emp_data['company_website'],
            location=emp_data['location'],
            is_verified=True
        )
        employer.set_password('Employer123!')
        db.session.add(employer)

    # Create candidates
    candidates = [
        {
            'email': 'omondi@example.com',
            'first_name': 'Omondi',
            'last_name': 'Lazarus',
            'phone': '+254712345678',
            'location': 'Nairobi'
        },
        {
            'email': 'wanjiru@example.com',
            'first_name': 'Mary',
            'last_name': 'Wanjiru',
            'phone': '+254723456789',
            'location': 'Nairobi'
        }
    ]

    for cand_data in candidates:
        candidate = User(
            email=cand_data['email'],
            role='candidate',
            first_name=cand_data['first_name'],
            last_name=cand_data['last_name'],
            phone=cand_data['phone'],
            location=cand_data['location'],
            is_verified=True
        )
        candidate.set_password('Candidate123!')
        db.session.add(candidate)

    db.session.commit()
    logger.info("✓ Sample users created")


def seed_jobs():
    """Create sample jobs"""
    logger.info("Creating sample jobs...")

    # Get employer
    employer = User.query.filter_by(role='employer').first()

    if not employer:
        logger.error("No employer found. Please seed users first.")
        return

    jobs = [
        {
            'title': 'Senior Software Engineer',
            'description': 'We are looking for an experienced software engineer to join our team.',
            'category': 'IT',
            'employment_type': 'full-time',
            'experience_level': 'senior',
            'location': 'Nairobi',
            'remote_allowed': True,
            'salary_min': 150000,
            'salary_max': 250000,
            'required_skills': ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
            'preferred_skills': ['Kubernetes', 'React', 'Redis'],
            'education_level': 'Bachelor\'s Degree',
            'experience_years': 5,
            'positions_available': 2,
            'application_deadline': datetime.utcnow() + timedelta(days=30)
        },
        {
            'title': 'Data Scientist',
            'description': 'Join our analytics team to drive data-driven decision making.',
            'category': 'IT',
            'employment_type': 'full-time',
            'experience_level': 'mid',
            'location': 'Nairobi',
            'remote_allowed': False,
            'salary_min': 120000,
            'salary_max': 180000,
            'required_skills': ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
            'preferred_skills': ['Deep Learning', 'Big Data', 'Tableau'],
            'education_level': 'Master\'s Degree',
            'experience_years': 3,
            'positions_available': 1,
            'application_deadline': datetime.utcnow() + timedelta(days=25)
        },
        {
            'title': 'Frontend Developer',
            'description': 'Build amazing user interfaces with modern web technologies.',
            'category': 'IT',
            'employment_type': 'full-time',
            'experience_level': 'mid',
            'location': 'Nairobi',
            'remote_allowed': True,
            'salary_min': 100000,
            'salary_max': 150000,
            'required_skills': ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
            'preferred_skills': ['TypeScript', 'Next.js', 'Tailwind CSS'],
            'education_level': 'Bachelor\'s Degree',
            'experience_years': 2,
            'positions_available': 3,
            'application_deadline': datetime.utcnow() + timedelta(days=20)
        }
    ]

    for job_data in jobs:
        job = Job(
            employer_id=employer.id,
            **job_data
        )
        db.session.add(job)

    db.session.commit()
    logger.info("✓ Sample jobs created")


def main():
    """Main seeding function"""
    app = create_app()

    with app.app_context():
        logger.info("Starting database seeding...")

        # Clear existing data (optional - comment out to preserve data)
        # logger.info("Clearing existing data...")
        # db.drop_all()
        # db.create_all()

        # Seed data
        seed_users()
        seed_jobs()

        logger.info("\n✓ Database seeding completed successfully!")
        logger.info("\nSample Login Credentials:")
        logger.info("Admin: admin@skillbridge.co.ke / Admin123!")
        logger.info("Employer: hr@safaricom.co.ke / Employer123!")
        logger.info("Candidate: omondi@example.com / Candidate123!")


if __name__ == '__main__':
    main()
