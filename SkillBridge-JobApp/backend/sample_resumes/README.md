# Sample Resumes for Testing

This directory contains sample resumes in multiple formats for testing the SkillBridge resume parsing functionality.

## 📄 Available Resumes

### 1. John Kamau Doe - Senior Software Engineer
- **Experience:** 5+ years
- **Key Skills:** Python, JavaScript, AWS, Docker, Kubernetes, ML/AI
- **Role:** Full-stack developer with cloud architecture expertise
- **Location:** Nairobi, Kenya
- **Files:**
  - `john_doe_resume.md` - Markdown source
  - `john_doe_resume.txt` - Plain text
  - `john_doe_resume.pdf` - PDF format (50KB)

### 2. Mary Wanjiru Njeri - Data Scientist
- **Experience:** 3+ years
- **Key Skills:** Python, Machine Learning, TensorFlow, PyTorch, Tableau, Big Data
- **Role:** Data scientist with predictive analytics expertise
- **Location:** Nairobi, Kenya
- **Files:**
  - `mary_wanjiru_resume.md` - Markdown source
  - `mary_wanjiru_resume.txt` - Plain text
  - `mary_wanjiru_resume.pdf` - PDF format (43KB)

### 3. David Omondi Otieno - Junior Full Stack Developer
- **Experience:** 2 years
- **Key Skills:** JavaScript, React, Node.js, MongoDB, M-PESA Integration
- **Role:** Junior developer focused on web applications
- **Location:** Kisumu, Kenya
- **Files:**
  - `david_omondi_resume.md` - Markdown source
  - `david_omondi_resume.txt` - Plain text
  - `david_omondi_resume.pdf` - PDF format (50KB)

## 🧪 Testing the Resume Parser

### Using PDF Files (Recommended)

```bash
# Start the Flask server
python app.py

# In another terminal, upload a resume
curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@sample_resumes/john_doe_resume.pdf"
```

### Using Text Files

```bash
curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@sample_resumes/john_doe_resume.txt"
```

## 📊 What Each Resume Tests

### John's Resume Tests:
- ✅ Multiple programming languages extraction
- ✅ Cloud technologies (AWS, GCP, Azure)
- ✅ Leadership and team management experience
- ✅ Advanced skills (AI/ML, DevOps, Kubernetes)
- ✅ Multiple certifications
- ✅ Publications and speaking engagements
- ✅ Long work history (5+ years)

### Mary's Resume Tests:
- ✅ Data science and ML framework extraction
- ✅ Statistical analysis tools
- ✅ Master's degree in progress
- ✅ Research and publications
- ✅ Kaggle competitions and community involvement
- ✅ Business intelligence skills

### David's Resume Tests:
- ✅ Junior-level experience (2 years)
- ✅ Modern web development stack
- ✅ Bootcamp education
- ✅ Personal projects and freelance work
- ✅ M-PESA payment integration experience
- ✅ Learning in progress (TypeScript, GraphQL)

## 🎯 Expected Parser Results

The Gemini-powered parser should extract:

1. **Personal Information:**
   - Name, email, phone, location
   - LinkedIn, GitHub profiles

2. **Skills:**
   - Technical skills (categorized)
   - Soft skills
   - Languages spoken

3. **Work Experience:**
   - Company names
   - Job titles
   - Dates (start/end)
   - Responsibilities and achievements

4. **Education:**
   - Degrees
   - Universities
   - Graduation dates
   - GPA (if mentioned)

5. **Certifications:**
   - Certificate names
   - Issuing organizations
   - Dates obtained

6. **Projects:**
   - Project names
   - Technologies used
   - Descriptions

## 🔄 Regenerating Files

If you need to regenerate the PDFs:

```bash
# Convert markdown to text
python scripts/convert_md_to_txt.py

# Convert text to PDF
cd sample_resumes
libreoffice --headless --convert-to pdf *.txt --outdir .
```

## 🇰🇪 Kenyan Context

All resumes feature:
- Authentic Kenyan names and locations
- Local companies (Safaricom, KCB, Equity Bank)
- M-PESA integration experience
- Kenyan phone number format (+254)
- Local universities and institutions
- Swahili and local languages

## 📝 File Formats Supported

The SkillBridge backend supports:
- ✅ PDF (`.pdf`) - Recommended
- ✅ Text (`.txt`)
- ✅ Word (`.doc`, `.docx`)

## 💡 Tips for Testing

1. **Test Different Formats:** Upload the same resume in different formats to verify consistent parsing
2. **Test Skill Extraction:** Check if specific skills like "Python", "React", "AWS" are extracted
3. **Test Experience Calculation:** Verify years of experience are calculated correctly
4. **Test Location Matching:** Use location filters with Nairobi/Kisumu
5. **Test Job Matching:** Upload David's resume and check matches for junior developer roles

## 🚀 Quick Test Workflow

```bash
# 1. Register a candidate
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.test@example.com",
    "password": "Test123!@#",
    "role": "candidate",
    "first_name": "John",
    "last_name": "Test"
  }'

# 2. Login and get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.test@example.com","password":"Test123!@#"}' \
  | jq -r '.data.tokens.access_token')

# 3. Upload resume
curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample_resumes/john_doe_resume.pdf"

# 4. Get matched jobs
curl http://localhost:5000/api/matching/jobs \
  -H "Authorization: Bearer $TOKEN"
```

## 📦 Files Included

```
sample_resumes/
├── README.md                    # This file
├── john_doe_resume.md          # Markdown source
├── john_doe_resume.txt         # Plain text
├── john_doe_resume.pdf         # PDF (50KB)
├── mary_wanjiru_resume.md      # Markdown source
├── mary_wanjiru_resume.txt     # Plain text
├── mary_wanjiru_resume.pdf     # PDF (43KB)
├── david_omondi_resume.md      # Markdown source
├── david_omondi_resume.txt     # Plain text
└── david_omondi_resume.pdf     # PDF (50KB)
```

---

**Ready to test the AI-powered resume parsing! 🚀**
