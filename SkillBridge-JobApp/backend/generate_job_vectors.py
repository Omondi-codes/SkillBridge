import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv
from services.job_matcher import JobMatcher
from services.vector_service import VectorService

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/skillbridge')
client = MongoClient(MONGODB_URI)
db = client.get_database()

# Initialize services
vector_service = VectorService()
job_matcher = JobMatcher(vector_service)

def generate_job_vectors():
    """Generate and store vector embeddings for all jobs"""
    print("Starting job vector generation...")
    print("-" * 80)

    # Get all active jobs
    jobs = list(db.jobs.find({'status': 'active'}))
    print(f"Found {len(jobs)} active jobs\n")

    success_count = 0
    error_count = 0

    for job in jobs:
        try:
            print(f"Processing: {job['title']} at {job['company_name']}")

            # Prepare job data for embedding
            job_data = {
                'title': job.get('title', ''),
                'description': job.get('description', ''),
                'required_skills': job.get('required_skills', []),
                'preferred_skills': job.get('preferred_skills', []),
                'experience_years': job.get('experience_years', 0),
                'location': job.get('location', '')
            }

            # Generate embedding
            job_embedding = job_matcher.generate_job_embedding(job_data)

            if not job_embedding:
                print(f"  ❌ Failed to generate embedding")
                error_count += 1
                continue

            # Prepare payload for vector storage
            payload = {
                'job_id': job['id'],
                'title': job.get('title', ''),
                'company_name': job.get('company_name', ''),
                'location': job.get('location', ''),
                'employment_type': job.get('employment_type', ''),
                'required_skills': job.get('required_skills', []),
                'preferred_skills': job.get('preferred_skills', []),
                'experience_years': job.get('experience_years', 0),
                'salary_min': job.get('salary_min', 0),
                'salary_max': job.get('salary_max', 0)
            }

            # Store in Qdrant
            vector_id = vector_service.store_job_vector(
                job_id=job['id'],
                embedding=job_embedding,
                metadata=payload
            )

            # Update MongoDB with vector_id
            db.jobs.update_one(
                {'id': job['id']},
                {'$set': {'vector_id': vector_id}}
            )

            print(f"  ✅ Generated and stored vector: {vector_id}")
            success_count += 1

        except Exception as e:
            print(f"  ❌ Error: {e}")
            error_count += 1

    print("\n" + "-" * 80)
    print(f"✅ Successfully processed {success_count} jobs")
    if error_count > 0:
        print(f"❌ Failed to process {error_count} jobs")
    print("Job vector generation completed!")

if __name__ == "__main__":
    try:
        generate_job_vectors()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)
