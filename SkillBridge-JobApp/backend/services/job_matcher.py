import os
import logging
from typing import Dict, List, Optional
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class JobMatcher:
    """
    Advanced job matching service using:
    - Vector similarity search via Qdrant
    - Collaborative filtering for ranking
    - Google Gemini for semantic understanding
    """

    def __init__(self, vector_service, api_key: Optional[str] = None):
        self.vector_service = vector_service
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')

        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.gemini_model = genai.GenerativeModel(os.getenv('GEMINI_MODEL', 'gemini-1.5-pro'))
        else:
            logger.warning("Gemini API key not found. Advanced matching features limited.")
            self.gemini_model = None

        # Load embedding model
        embedding_model_name = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-mpnet-base-v2')
        self.embedding_model = SentenceTransformer(embedding_model_name)

    def generate_job_embedding(self, job_data: Dict) -> List[float]:
        """Generate embedding for job posting"""
        embedding_text = f"""
        Title: {job_data.get('title', '')}
        Description: {job_data.get('description', '')}
        Required Skills: {', '.join(job_data.get('required_skills', []))}
        Preferred Skills: {', '.join(job_data.get('preferred_skills', []))}
        Experience: {job_data.get('experience_years', 0)} years
        Location: {job_data.get('location', '')}
        """

        try:
            embedding = self.embedding_model.encode(embedding_text.strip(), convert_to_tensor=False)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating job embedding: {e}")
            return []

    def match_jobs_for_candidate(self, resume_data: Dict, resume_embedding: List[float],
                                 filters: Optional[Dict] = None, limit: int = 10) -> List[Dict]:
        """
        Find best matching jobs for a candidate
        """
        # Search similar jobs using vector similarity
        similar_jobs = self.vector_service.search_similar_jobs(
            resume_vector=resume_embedding,
            filters=filters,
            limit=limit * 2  # Get more for reranking
        )

        # Enhance with detailed matching
        enhanced_matches = []
        for job_match in similar_jobs:
            match_details = self._calculate_detailed_match(
                resume_data,
                job_match['payload']
            )

            enhanced_matches.append({
                'job_id': job_match['job_id'],
                'similarity_score': job_match['score'],
                'overall_score': match_details['overall_score'],
                'skill_match_percentage': match_details['skill_match_percentage'],
                'experience_match': match_details['experience_match'],
                'location_match': match_details['location_match'],
                'match_details': match_details
            })

        # Sort by overall score
        enhanced_matches.sort(key=lambda x: x['overall_score'], reverse=True)

        return enhanced_matches[:limit]

    def match_candidates_for_job(self, job_data: Dict, job_embedding: List[float],
                                filters: Optional[Dict] = None, limit: int = 20) -> List[Dict]:
        """
        Find best matching candidates for a job
        """
        # Search similar candidates using vector similarity
        similar_candidates = self.vector_service.search_similar_candidates(
            job_vector=job_embedding,
            filters=filters,
            limit=limit * 2  # Get more for reranking
        )

        # Enhance with detailed matching
        enhanced_matches = []
        for candidate_match in similar_candidates:
            match_details = self._calculate_candidate_job_match(
                candidate_match['payload'],
                job_data
            )

            enhanced_matches.append({
                'user_id': candidate_match['user_id'],
                'similarity_score': candidate_match['score'],
                'overall_score': match_details['overall_score'],
                'skill_match_percentage': match_details['skill_match_percentage'],
                'experience_match': match_details['experience_match'],
                'location_match': match_details['location_match'],
                'match_details': match_details
            })

        # Sort by overall score
        enhanced_matches.sort(key=lambda x: x['overall_score'], reverse=True)

        return enhanced_matches[:limit]

    def _calculate_detailed_match(self, resume_data: Dict, job_payload: Dict) -> Dict:
        """
        Calculate detailed matching metrics between resume and job
        """
        # Extract original skills (preserve case)
        candidate_skills_orig = resume_data.get('skills', [])
        required_skills_orig = job_payload.get('required_skills', [])
        preferred_skills_orig = job_payload.get('preferred_skills', [])

        # Create lowercase versions for comparison
        candidate_skills_lower = set([s.lower() for s in candidate_skills_orig])
        required_skills_lower = set([s.lower() for s in required_skills_orig])
        preferred_skills_lower = set([s.lower() for s in preferred_skills_orig])

        # Create mapping from lowercase to original case (prefer job posting case)
        required_skills_map = {s.lower(): s for s in required_skills_orig}
        preferred_skills_map = {s.lower(): s for s in preferred_skills_orig}

        candidate_experience = resume_data.get('experience_years', 0)
        required_experience = job_payload.get('experience_years', 0)

        candidate_location = resume_data.get('location', '').lower()
        job_location = job_payload.get('location', '').lower()

        # Skill matching (case-insensitive)
        if required_skills_lower:
            matched_required_lower = candidate_skills_lower.intersection(required_skills_lower)
            skill_match_percentage = (len(matched_required_lower) / len(required_skills_lower)) * 100
            # Map back to original case from job posting
            matched_required = [required_skills_map[s] for s in matched_required_lower]
        else:
            skill_match_percentage = 100
            matched_required = []

        matched_preferred_lower = candidate_skills_lower.intersection(preferred_skills_lower) if preferred_skills_lower else set()
        matched_preferred = [preferred_skills_map[s] for s in matched_preferred_lower]

        # Missing skills (preserve job posting case)
        missing_skills_lower = required_skills_lower - candidate_skills_lower if required_skills_lower else set()
        missing_skills = [required_skills_map[s] for s in missing_skills_lower]

        # Experience matching
        experience_match = candidate_experience >= required_experience

        # Location matching
        location_match = (candidate_location == job_location) if job_location else True

        # Calculate overall score (weighted)
        weights = {
            'skills': 0.5,
            'experience': 0.3,
            'location': 0.2
        }

        skill_score = skill_match_percentage / 100
        experience_score = 1.0 if experience_match else max(0, 1 - (required_experience - candidate_experience) / 10)
        location_score = 1.0 if location_match else 0.5

        overall_score = (
            weights['skills'] * skill_score +
            weights['experience'] * experience_score +
            weights['location'] * location_score
        )

        return {
            'overall_score': overall_score,
            'skill_match_percentage': skill_match_percentage,
            'matched_required_skills': matched_required,
            'matched_preferred_skills': matched_preferred,
            'missing_skills': missing_skills,
            'experience_match': experience_match,
            'candidate_experience': candidate_experience,
            'required_experience': required_experience,
            'location_match': location_match
        }

    def _calculate_candidate_job_match(self, candidate_payload: Dict, job_data: Dict) -> Dict:
        """
        Calculate match between candidate and job (reverse of above)
        """
        # Extract data
        candidate_skills = set([s.lower() for s in candidate_payload.get('skills', [])])
        required_skills = set([s.lower() for s in job_data.get('required_skills', [])])
        preferred_skills = set([s.lower() for s in job_data.get('preferred_skills', [])])

        candidate_experience = candidate_payload.get('experience_years', 0)
        required_experience = job_data.get('experience_years', 0)

        candidate_location = candidate_payload.get('location', '').lower()
        job_location = job_data.get('location', '').lower()

        # Skill matching
        if required_skills:
            matched_required = candidate_skills.intersection(required_skills)
            skill_match_percentage = (len(matched_required) / len(required_skills)) * 100
        else:
            skill_match_percentage = 100

        # Experience matching
        experience_match = candidate_experience >= required_experience

        # Location matching
        location_match = (candidate_location == job_location) if job_location else True

        # Calculate overall score
        weights = {
            'skills': 0.5,
            'experience': 0.3,
            'location': 0.2
        }

        skill_score = skill_match_percentage / 100
        experience_score = 1.0 if experience_match else max(0, 1 - (required_experience - candidate_experience) / 10)
        location_score = 1.0 if location_match else 0.5

        overall_score = (
            weights['skills'] * skill_score +
            weights['experience'] * experience_score +
            weights['location'] * location_score
        )

        return {
            'overall_score': overall_score,
            'skill_match_percentage': skill_match_percentage,
            'experience_match': experience_match,
            'location_match': location_match
        }

    def explain_match_with_gemini(self, resume_data: Dict, job_data: Dict,
                                  match_score: float) -> Optional[str]:
        """
        Use Gemini to generate human-readable match explanation
        """
        if not self.gemini_model:
            return None

        try:
            prompt = f"""
            Generate a brief explanation (2-3 sentences) of why this candidate matches this job.
            Match Score: {match_score:.2f}

            Candidate:
            - Skills: {', '.join(resume_data.get('skills', [])[:10])}
            - Experience: {resume_data.get('experience_years', 0)} years
            - Location: {resume_data.get('location', '')}

            Job:
            - Title: {job_data.get('title', '')}
            - Required Skills: {', '.join(job_data.get('required_skills', []))}
            - Required Experience: {job_data.get('experience_years', 0)} years
            - Location: {job_data.get('location', '')}

            Provide a concise, professional explanation highlighting strengths and areas for growth.
            """

            response = self.gemini_model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.error(f"Error generating match explanation: {e}")
            return None

    def rank_with_collaborative_filtering(self, matches: List[Dict],
                                         user_history: List[str]) -> List[Dict]:
        """
        Re-rank matches using collaborative filtering based on user history
        """
        # Simple implementation - can be enhanced with actual CF algorithm
        # For now, boost jobs similar to previously applied/viewed jobs

        if not user_history:
            return matches

        # In a real implementation, you would:
        # 1. Build user-item interaction matrix
        # 2. Find similar users
        # 3. Recommend jobs liked by similar users
        # 4. Adjust scores accordingly

        # Placeholder: return matches as-is
        return matches
