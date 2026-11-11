#!/usr/bin/env python3
"""
Initialize Qdrant vector database collections
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from services.vector_service import VectorService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()


def main():
    """Initialize Qdrant collections"""
    try:
        logger.info("Initializing Qdrant vector database...")

        vector_service = VectorService()

        # Initialize collections
        success = vector_service.initialize_collections()

        if success:
            logger.info("✓ Qdrant collections created successfully!")

            # Get collection info
            resumes_info = vector_service.get_collection_info('resumes')
            jobs_info = vector_service.get_collection_info('jobs')

            logger.info(f"\nResumes Collection:")
            logger.info(f"  - Vectors: {resumes_info['vectors_count']}")
            logger.info(f"  - Status: {resumes_info['status']}")

            logger.info(f"\nJobs Collection:")
            logger.info(f"  - Vectors: {jobs_info['vectors_count']}")
            logger.info(f"  - Status: {jobs_info['status']}")

        else:
            logger.error("✗ Failed to initialize Qdrant collections")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error initializing Qdrant: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
