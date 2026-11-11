import os
import re
import logging
from typing import Dict, List, Optional
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import spacy
import PyPDF2
import docx
from io import BytesIO

logger = logging.getLogger(__name__)


class ResumeParser:
    """
    Advanced resume parser using Google Gemini API for intelligent text understanding
    and sentence-transformers for embedding generation
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Use gemini-2.5-flash for high usage limits and fast performance
            self.gemini_model = genai.GenerativeModel(os.getenv('GEMINI_MODEL', 'gemini-2.5-flash'))
            logger.info(f"Initialized Gemini model: {os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')}")
        else:
            logger.warning("Gemini API key not found. Using fallback parsing.")
            self.gemini_model = None

        # Load embedding model
        embedding_model_name = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-mpnet-base-v2')
        self.embedding_model = SentenceTransformer(embedding_model_name)

        # Load spaCy for basic NLP
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except OSError:
            logger.warning("spaCy model not found. Some features may be limited.")
            self.nlp = None

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            return ""

    def extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            doc_file = BytesIO(file_content)
            doc = docx.Document(doc_file)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            return ""

    def extract_text(self, file_content: bytes, filename: str) -> str:
        """Extract text based on file type"""
        if filename.lower().endswith('.pdf'):
            return self.extract_text_from_pdf(file_content)
        elif filename.lower().endswith('.docx'):
            return self.extract_text_from_docx(file_content)
        elif filename.lower().endswith('.txt'):
            return file_content.decode('utf-8', errors='ignore')
        else:
            raise ValueError(f"Unsupported file format: {filename}")

    def parse_with_gemini(self, resume_text: str) -> Dict:
        """Parse resume using Google Gemini API"""
        if not self.gemini_model:
            return self.fallback_parse(resume_text)

        try:
            logger.info("=" * 80)
            logger.info("STARTING GEMINI RESUME PARSING")
            logger.info("=" * 80)
            logger.info(f"Resume text length: {len(resume_text)} characters")
            logger.info(f"Resume preview (first 200 chars): {resume_text[:200]}")

            prompt = f"""
            Analyze the following resume and extract structured information in JSON format.

            Extract:
            1. Personal Information (name, email, phone, location, linkedin, github)
            2. Professional Summary
            3. Skills (categorized into technical skills, soft skills, languages, tools)
            4. Work Experience (company, position, location, start_date, end_date, description, achievements)
            5. Education (institution, degree, field, start_date, end_date, gpa)
            6. Certifications (name, issuer, date, credential_id)
            7. Projects (name, description, technologies, url)
            8. Awards and Achievements

            Resume Text:
            {resume_text}

            Return ONLY valid JSON without any markdown formatting or extra text.
            """

            logger.info("Sending request to Gemini API...")
            response = self.gemini_model.generate_content(prompt)
            result_text = response.text.strip()

            logger.info("-" * 80)
            logger.info("GEMINI RAW RESPONSE:")
            logger.info("-" * 80)
            logger.info(result_text)
            logger.info("-" * 80)

            # Clean markdown code blocks if present
            if result_text.startswith('```'):
                logger.info("Detected markdown code blocks, cleaning...")
                result_text = re.sub(r'^```json\s*', '', result_text)
                result_text = re.sub(r'\s*```$', '', result_text)
                logger.info(f"Cleaned text (first 500 chars): {result_text[:500]}")

            import json
            logger.info("Parsing JSON response...")
            parsed_data = json.loads(result_text)

            logger.info("-" * 80)
            logger.info("PARSED DATA STRUCTURE:")
            logger.info("-" * 80)
            logger.info(f"Keys in parsed data: {list(parsed_data.keys())}")

            if 'personal_info' in parsed_data:
                logger.info(f"Personal info fields: {list(parsed_data['personal_info'].keys())}")
            if 'skills' in parsed_data:
                if isinstance(parsed_data['skills'], list):
                    logger.info(f"Skills (array): {len(parsed_data['skills'])} items")
                else:
                    logger.info(f"Skills (categorized): {list(parsed_data['skills'].keys())}")
            if 'experience' in parsed_data:
                logger.info(f"Experience entries: {len(parsed_data['experience'])}")
            if 'education' in parsed_data:
                logger.info(f"Education entries: {len(parsed_data['education'])}")
            if 'certifications' in parsed_data:
                logger.info(f"Certifications: {len(parsed_data['certifications'])}")
            if 'projects' in parsed_data:
                logger.info(f"Projects: {len(parsed_data['projects'])}")
            if 'awards' in parsed_data:
                logger.info(f"Awards: {len(parsed_data['awards']) if isinstance(parsed_data['awards'], list) else 'N/A'}")

            logger.info("=" * 80)
            logger.info("GEMINI PARSING COMPLETED SUCCESSFULLY")
            logger.info("=" * 80)

            return parsed_data

        except Exception as e:
            logger.error("=" * 80)
            logger.error(f"GEMINI PARSING FAILED: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error details: {str(e)}")
            logger.error("Falling back to regex parsing...")
            logger.error("=" * 80)
            return self.fallback_parse(resume_text)

    def fallback_parse(self, resume_text: str) -> Dict:
        """Fallback parsing using regex and spaCy when Gemini is unavailable"""
        
        parsed_data = {
            'personal_info': {},
            'summary': '',
            'skills': [],
            'experience': [],
            'education': [],
            'certifications': [],
            'projects': [],
            'awards': []
        }

        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text)
        if email_match:
            parsed_data['personal_info']['email'] = email_match.group()

        # Extract phone
        phone_match = re.search(r'\+?[\d\s\-\(\)]{10,}', resume_text)
        if phone_match:
            parsed_data['personal_info']['phone'] = phone_match.group()

        # Extract skills (basic keyword matching)
        skill_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
            'flask', 'django', 'spring', 'sql', 'mongodb', 'postgresql', 'mysql',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'ci/cd',
            'machine learning', 'deep learning', 'data analysis', 'tensorflow',
            'pytorch', 'scikit-learn', 'pandas', 'numpy', 'excel', 'powerbi',
            'project management', 'agile', 'scrum', 'leadership', 'communication'
        ]

        text_lower = resume_text.lower()
        for skill in skill_keywords:
            if skill in text_lower:
                parsed_data['skills'].append(skill.title())

        # Use spaCy for basic entity extraction
        if self.nlp:
            doc = self.nlp(resume_text[:100000])  # Limit text length
            for ent in doc.ents:
                if ent.label_ == 'PERSON' and not parsed_data['personal_info'].get('name'):
                    parsed_data['personal_info']['name'] = ent.text
                elif ent.label_ == 'GPE' and not parsed_data['personal_info'].get('location'):
                    parsed_data['personal_info']['location'] = ent.text

        return parsed_data

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text"""
        try:
            embedding = self.embedding_model.encode(text, convert_to_tensor=False)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return []

    def parse_resume(self, file_content: bytes, filename: str) -> Dict:
        """
        Main method to parse resume
        Returns structured data and embedding
        """
        # Extract text from file
        resume_text = self.extract_text(file_content, filename)

        if not resume_text:
            raise ValueError("Could not extract text from resume")

        # Parse with Gemini
        parsed_data = self.parse_with_gemini(resume_text)

        # Generate embedding
        # Combine relevant fields for embedding
        embedding_text = f"""
        {parsed_data.get('summary', '')}
        Skills: {', '.join(parsed_data.get('skills', []))}
        Experience: {self._format_experience_for_embedding(parsed_data.get('experience', []))}
        Education: {self._format_education_for_embedding(parsed_data.get('education', []))}
        """

        embedding = self.generate_embedding(embedding_text.strip())

        return {
            'raw_text': resume_text,
            'parsed_data': parsed_data,
            'embedding': embedding,
            'embedding_dimension': len(embedding)
        }

    def _format_experience_for_embedding(self, experience: List[Dict]) -> str:
        """Format experience for embedding generation"""
        formatted = []
        for exp in experience:
            if isinstance(exp, dict):
                formatted.append(f"{exp.get('position', '')} at {exp.get('company', '')}")
        return "; ".join(formatted)

    def _format_education_for_embedding(self, education: List[Dict]) -> str:
        """Format education for embedding generation"""
        formatted = []
        for edu in education:
            if isinstance(edu, dict):
                formatted.append(f"{edu.get('degree', '')} in {edu.get('field', '')}")
        return "; ".join(formatted)

    def extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from any text using Gemini"""
        if not self.gemini_model:
            return []

        try:
            prompt = f"""
            Extract all technical skills, tools, and technologies mentioned in the following text.
            Return only a comma-separated list of skills without any other text.

            Text: {text[:2000]}
            """

            response = self.gemini_model.generate_content(prompt)
            skills_text = response.text.strip()
            skills = [s.strip() for s in skills_text.split(',')]
            return skills

        except Exception as e:
            logger.error(f"Error extracting skills: {e}")
            return []
