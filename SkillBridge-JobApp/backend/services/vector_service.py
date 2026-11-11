import os
import logging
from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue, Range
)
import uuid

logger = logging.getLogger(__name__)


class VectorService:
    """
    Service for managing vectors in Qdrant database
    Handles resume and job embeddings for similarity search
    """

    def __init__(self):
        self.host = os.getenv('QDRANT_HOST', 'localhost')
        self.port = int(os.getenv('QDRANT_PORT', 6333))
        self.api_key = os.getenv('QDRANT_API_KEY')
        self.dimension = int(os.getenv('EMBEDDING_DIMENSION', 768))

        # Collection names
        self.resume_collection = 'resumes'
        self.job_collection = 'jobs'

        # Initialize client
        if self.api_key:
            self.client = QdrantClient(host=self.host, port=self.port, api_key=self.api_key)
        else:
            self.client = QdrantClient(host=self.host, port=self.port)

        logger.info(f"Qdrant client initialized: {self.host}:{self.port}")

        # Auto-create collections if they don't exist
        self._ensure_collections_exist()

    def _ensure_collections_exist(self):
        """Ensure collections exist, create them if they don't"""
        try:
            # Check and create resume collection
            if not self.collection_exists(self.resume_collection):
                self.client.create_collection(
                    collection_name=self.resume_collection,
                    vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE)
                )
                logger.info(f"Auto-created collection: {self.resume_collection}")

            # Check and create job collection
            if not self.collection_exists(self.job_collection):
                self.client.create_collection(
                    collection_name=self.job_collection,
                    vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE)
                )
                logger.info(f"Auto-created collection: {self.job_collection}")

        except Exception as e:
            logger.warning(f"Could not auto-create collections: {e}")

    def initialize_collections(self):
        """Initialize Qdrant collections for resumes and jobs"""
        try:
            # Create resume collection
            self.client.recreate_collection(
                collection_name=self.resume_collection,
                vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE)
            )
            logger.info(f"Created collection: {self.resume_collection}")

            # Create job collection
            self.client.recreate_collection(
                collection_name=self.job_collection,
                vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE)
            )
            logger.info(f"Created collection: {self.job_collection}")

            return True

        except Exception as e:
            logger.error(f"Error initializing collections: {e}")
            return False

    def collection_exists(self, collection_name: str) -> bool:
        """Check if collection exists"""
        try:
            collections = self.client.get_collections().collections
            return any(col.name == collection_name for col in collections)
        except Exception as e:
            logger.error(f"Error checking collection: {e}")
            return False

    def store_resume_vector(self, user_id: str, embedding: List[float],
                           metadata: Dict) -> Optional[str]:
        """
        Store resume embedding in Qdrant
        Returns vector ID
        """
        try:
            vector_id = str(uuid.uuid4())

            payload = {
                'user_id': user_id,
                'skills': metadata.get('skills', []),
                'experience_years': metadata.get('experience_years', 0),
                'location': metadata.get('location', ''),
                'education_level': metadata.get('education_level', ''),
                'job_titles': metadata.get('job_titles', []),
                'industries': metadata.get('industries', [])
            }

            point = PointStruct(
                id=vector_id,
                vector=embedding,
                payload=payload
            )

            self.client.upsert(
                collection_name=self.resume_collection,
                points=[point]
            )

            logger.info(f"Stored resume vector: {vector_id} for user: {user_id}")
            return vector_id

        except Exception as e:
            logger.error(f"Error storing resume vector: {e}")
            return None

    def store_job_vector(self, job_id: str, embedding: List[float],
                        metadata: Dict) -> Optional[str]:
        """
        Store job embedding in Qdrant
        Returns vector ID
        """
        try:
            vector_id = str(uuid.uuid4())

            payload = {
                'job_id': job_id,
                'required_skills': metadata.get('required_skills', []),
                'preferred_skills': metadata.get('preferred_skills', []),
                'experience_years': metadata.get('experience_years', 0),
                'location': metadata.get('location', ''),
                'employment_type': metadata.get('employment_type', ''),
                'salary_min': metadata.get('salary_min', 0),
                'salary_max': metadata.get('salary_max', 0),
                'category': metadata.get('category', ''),
                'company': metadata.get('company', '')
            }

            point = PointStruct(
                id=vector_id,
                vector=embedding,
                payload=payload
            )

            self.client.upsert(
                collection_name=self.job_collection,
                points=[point]
            )

            logger.info(f"Stored job vector: {vector_id} for job: {job_id}")
            return vector_id

        except Exception as e:
            logger.error(f"Error storing job vector: {e}")
            return None

    def search_similar_jobs(self, resume_vector: List[float],
                           filters: Optional[Dict] = None,
                           limit: int = 10) -> List[Dict]:
        """
        Search for jobs similar to a resume
        """
        try:
            # Build filter if provided
            search_filter = None
            if filters:
                conditions = []

                if 'location' in filters:
                    conditions.append(
                        FieldCondition(key='location', match=MatchValue(value=filters['location']))
                    )

                if 'employment_type' in filters:
                    conditions.append(
                        FieldCondition(key='employment_type', match=MatchValue(value=filters['employment_type']))
                    )

                if 'min_salary' in filters:
                    conditions.append(
                        FieldCondition(key='salary_min', range=Range(gte=filters['min_salary']))
                    )

                if conditions:
                    search_filter = Filter(must=conditions)

            # Perform search
            results = self.client.search(
                collection_name=self.job_collection,
                query_vector=resume_vector,
                query_filter=search_filter,
                limit=limit,
                with_payload=True
            )

            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    'job_id': result.payload.get('job_id'),
                    'score': result.score,
                    'payload': result.payload
                })

            return formatted_results

        except Exception as e:
            logger.error(f"Error searching similar jobs: {e}")
            return []

    def search_similar_candidates(self, job_vector: List[float],
                                 filters: Optional[Dict] = None,
                                 limit: int = 20) -> List[Dict]:
        """
        Search for candidates similar to a job
        """
        try:
            # Build filter if provided
            search_filter = None
            if filters:
                conditions = []

                if 'location' in filters:
                    conditions.append(
                        FieldCondition(key='location', match=MatchValue(value=filters['location']))
                    )

                if 'min_experience' in filters:
                    conditions.append(
                        FieldCondition(key='experience_years', range=Range(gte=filters['min_experience']))
                    )

                if conditions:
                    search_filter = Filter(must=conditions)

            # Perform search
            results = self.client.search(
                collection_name=self.resume_collection,
                query_vector=job_vector,
                query_filter=search_filter,
                limit=limit,
                with_payload=True
            )

            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    'user_id': result.payload.get('user_id'),
                    'score': result.score,
                    'payload': result.payload
                })

            return formatted_results

        except Exception as e:
            logger.error(f"Error searching similar candidates: {e}")
            return []

    def update_resume_vector(self, vector_id: str, embedding: List[float],
                            metadata: Dict) -> bool:
        """Update existing resume vector"""
        try:
            payload = {
                'user_id': metadata.get('user_id'),
                'skills': metadata.get('skills', []),
                'experience_years': metadata.get('experience_years', 0),
                'location': metadata.get('location', ''),
                'education_level': metadata.get('education_level', ''),
                'job_titles': metadata.get('job_titles', []),
                'industries': metadata.get('industries', [])
            }

            point = PointStruct(
                id=vector_id,
                vector=embedding,
                payload=payload
            )

            self.client.upsert(
                collection_name=self.resume_collection,
                points=[point]
            )

            return True

        except Exception as e:
            logger.error(f"Error updating resume vector: {e}")
            return False

    def delete_resume_vector(self, vector_id: str) -> bool:
        """Delete resume vector"""
        try:
            self.client.delete(
                collection_name=self.resume_collection,
                points_selector=[vector_id]
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting resume vector: {e}")
            return False

    def delete_job_vector(self, vector_id: str) -> bool:
        """Delete job vector"""
        try:
            self.client.delete(
                collection_name=self.job_collection,
                points_selector=[vector_id]
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting job vector: {e}")
            return False

    def get_collection_info(self, collection_name: str) -> Optional[Dict]:
        """Get information about a collection"""
        try:
            info = self.client.get_collection(collection_name)
            return {
                'name': collection_name,
                'vectors_count': info.vectors_count,
                'points_count': info.points_count,
                'status': info.status
            }
        except Exception as e:
            logger.error(f"Error getting collection info: {e}")
            return None
