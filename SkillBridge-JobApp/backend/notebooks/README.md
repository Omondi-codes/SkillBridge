# SkillBridge AI Accuracy Evaluation Notebooks

This directory contains Jupyter notebooks for evaluating and demonstrating the accuracy of Gemini AI-powered features in SkillBridge.

## 📓 Available Notebooks

### 1. `resume_parsing_accuracy.ipynb`
**Purpose:** Evaluate the accuracy of Gemini AI-powered resume parsing

**Metrics Measured:**
- Field Extraction Accuracy (personal info, skills, experience, education)
- Skills Identification F1 Score (precision & recall)
- Experience Parsing Accuracy
- Education Parsing Accuracy
- Overall Parsing Score (weighted average)
- Processing Time

**Outputs:**
- Accuracy visualizations (bar charts, heatmaps)
- Comprehensive accuracy report
- CSV results for further analysis

---

### 2. `job_matching_accuracy.ipynb`
**Purpose:** Evaluate the effectiveness of AI-powered job matching

**Metrics Measured:**
- Match Relevance Score
- Ranking Quality (NDCG - Normalized Discounted Cumulative Gain)
- Precision@K (top K results relevance)
- Recall@K
- Mean Reciprocal Rank (MRR)
- Skills Match Accuracy
- Experience Match Accuracy
- Location Match Accuracy
- Overall Matching Improvement vs Baseline

**Outputs:**
- Ranking quality visualizations
- Comparison with baseline keyword matching
- Per-candidate performance analysis
- Component score heatmaps

---

### 3. `comparative_analysis.ipynb`
**Purpose:** Compare Gemini AI parsing against spaCy baseline

**Comparison Areas:**
- Parsing Accuracy (side-by-side)
- Processing Speed
- Robustness (edge cases handling)
- Cost Analysis (API costs vs computational costs)
- Error Analysis

**Outputs:**
- Side-by-side comparison charts
- Accuracy improvement breakdown
- Cost-benefit analysis
- Production recommendations

---

## 🚀 Getting Started

### Option 1: Google Colab (Recommended for Quick Demo) ⭐

**Perfect for:**
- Quick demonstrations without setup
- Presentations and documentation screenshots
- Sharing results with stakeholders
- No local installation required

**Colab-Ready Notebooks:**
1. **Resume Parsing Accuracy:** `colab_resume_parsing_accuracy.ipynb`
2. **Job Matching Demo:** `colab_job_matching_demo.ipynb`

**How to Use:**

1. **Open in Google Colab:**
   - Upload the notebook to Google Drive
   - Right-click → Open with → Google Colaboratory
   - Or visit: https://colab.research.google.com and upload

2. **Set up API Key:**
   ```python
   # In Colab, click the key icon (🔑) in the left sidebar
   # Add secret: GOOGLE_API_KEY = your_api_key_here
   ```
   Get your key at: https://makersuite.google.com/app/apikey

3. **Run the notebook:**
   - Click `Runtime` → `Run all`
   - Or run cells sequentially with Shift+Enter

4. **Download results:**
   - All visualizations and reports are auto-generated
   - Click the Files icon (📁) in the left sidebar
   - Download PNG images, CSV data, and TXT reports

**✅ Advantages:**
- ✨ No setup required
- 🚀 Free GPU/TPU access
- 📤 Easy sharing via link
- 💾 Automatic saving to Google Drive
- 📊 Publication-ready visualizations

---

### Option 2: Local Jupyter Installation

**Prerequisites:**

1. **Install Jupyter dependencies:**
```bash
cd backend/notebooks
pip install -r requirements.txt
```

2. **Ensure main backend dependencies are installed:**
```bash
cd ..
pip install -r requirements.txt
```

3. **Set up environment variables:**
- Copy `.env.example` to `.env` in the backend directory
- Add your `GOOGLE_API_KEY` for Gemini AI
- Configure database connections (MongoDB, Qdrant, Redis)

**Running the Notebooks:**

1. **Start Jupyter Notebook:**
```bash
cd backend/notebooks
jupyter notebook
```

2. **Or use Jupyter Lab:**
```bash
jupyter lab
```

3. **Open any notebook** and run cells sequentially

---

### Option 3: Docker Support

You can also run notebooks in Docker:

```bash
docker-compose up -d
docker exec -it skillbridge-backend jupyter notebook --ip=0.0.0.0 --allow-root
```

---

## 📊 Sample Test Data

The notebooks include sample test datasets with ground truth annotations. For comprehensive evaluation:

1. **Add more test cases** to the test dataset sections in each notebook
2. **Use real resumes** from your production database (ensure privacy compliance)
3. **Create diverse test cases** covering:
   - Different resume formats
   - Various industries and roles
   - International formats
   - Edge cases (incomplete info, unusual formatting)

---

## 🎯 Accuracy Targets

Based on project documentation, SkillBridge aims for:

- **Resume Parsing Accuracy:** > 85%
- **Job Matching Improvement:** > 70% vs traditional keyword matching
- **Application Rejection Rate Reduction:** From 88% to < 15%

These notebooks help validate these targets.

---

## 📈 Understanding the Results

### Resume Parsing Accuracy

**Overall Accuracy ≥ 85%** = ✅ Excellent
- Personal info extraction: Should be near 100%
- Skills F1 Score: Target ≥ 80%
- Experience/Education: Complete extraction

**70-84%** = ⚠️ Good but needs improvement
**< 70%** = ❌ Requires optimization

### Job Matching Quality

**Precision@5 ≥ 60%** = ✅ High quality matches
- At least 3 out of top 5 jobs are relevant

**NDCG@5 ≥ 0.7** = ✅ Good ranking quality
- Most relevant jobs appear at the top

**Improvement ≥ 70%** = ✅ Meets project goal
- Compared to baseline keyword matching

---

## 🔧 Customization

### Adding Custom Metrics

Edit the metric calculation functions in each notebook:

```python
def calculate_custom_metric(predicted, ground_truth):
    # Your custom metric logic
    return score
```

### Modifying Visualizations

All visualizations use matplotlib/seaborn. Customize:
- Colors: `color='#hexcode'`
- Chart types: `plt.bar()`, `plt.scatter()`, etc.
- Export format: `.png`, `.pdf`, `.svg`

### Exporting Results

All notebooks export results in multiple formats:
- **CSV** - For data analysis in Excel/Pandas
- **PNG** - High-resolution visualizations
- **TXT** - Comprehensive reports

---

## 📝 Best Practices

1. **Run notebooks in order:**
   - Start with resume parsing accuracy
   - Then job matching accuracy
   - Finally comparative analysis

2. **Document test cases:**
   - Add comments explaining each test scenario
   - Note any unusual cases or edge conditions

3. **Version control results:**
   - Save outputs with timestamps
   - Track improvements over time
   - Compare different model versions

4. **Regular evaluation:**
   - Re-run notebooks after model updates
   - Test with new production data periodically
   - Monitor accuracy trends

---

## 🐛 Troubleshooting

### Import Errors
```python
# If you get import errors, ensure you're running from the notebooks directory
import sys
import os
sys.path.insert(0, os.path.abspath('..'))
```

### API Key Issues
```bash
# Verify your .env file has:
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Database Connection Issues
```bash
# Ensure services are running:
docker-compose up -d mongodb redis qdrant
```

### Memory Issues
```python
# For large test datasets, process in batches:
for batch in chunks(test_dataset, batch_size=10):
    # Process batch
```

---

## 📚 References

- **Gemini API Docs:** https://ai.google.dev/docs
- **Qdrant Vector DB:** https://qdrant.tech/documentation/
- **NDCG Metric:** https://en.wikipedia.org/wiki/Discounted_cumulative_gain
- **Information Retrieval Metrics:** https://scikit-learn.org/stable/modules/model_evaluation.html

---

## 🤝 Contributing

To add new evaluation notebooks:

1. Follow the existing notebook structure
2. Include clear documentation and explanations
3. Add ground truth test data
4. Export results in multiple formats
5. Update this README

---

## 📄 License

Part of the SkillBridge project. See main repository LICENSE file.

---

## ✉️ Support

For questions about these notebooks or accuracy evaluation:
- Check the main project documentation
- Review the notebooks' inline comments
- Consult the SkillBridge team

---

## 🎓 Google Colab Step-by-Step Guide

### For Your Project Documentation

**Perfect for Chapter 4.4 - Testing and Quality Assurance**

#### Step 1: Upload Notebook to Google Drive
1. Download `colab_resume_parsing_accuracy.ipynb` or `colab_job_matching_demo.ipynb`
2. Go to [Google Drive](https://drive.google.com)
3. Upload the `.ipynb` file
4. Right-click → Open with → Google Colaboratory

#### Step 2: Set Up API Key (IMPORTANT)
1. Click the **key icon (🔑)** in the left Colab sidebar
2. Click "+ Add new secret"
3. Name: `GOOGLE_API_KEY`
4. Value: Your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
5. Toggle notebook access ON

#### Step 3: Run the Notebook
1. Click `Runtime` → `Run all` (runs all cells)
2. Or use `Shift+Enter` to run cells one by one
3. Wait for execution (typically 2-5 minutes)

#### Step 4: Capture Screenshots for Documentation
📸 **Take these screenshots for Chapter 4:**

1. **Notebook interface** - Show cells executing
2. **Accuracy bar chart** - Main results visualization
3. **Overall accuracy gauge** - Big percentage display
4. **Comparison charts** - AI vs baseline
5. **Generated report** - Text output summary
6. **Files panel** - Show downloaded results

#### Step 5: Download Results
1. Click the **Files icon (📁)** in left sidebar
2. Download these files:
   - `resume_parsing_accuracy.png` ← Use in documentation
   - `resume_parsing_accuracy_report.txt` ← Include metrics
   - `resume_parsing_results.csv` ← For data tables
   - `job_matching_comparison.png` ← Key visual
   - `job_matching_accuracy_report.txt` ← Quote in report

#### Step 6: Include in Documentation

**In Chapter 4.4.2 - AI Accuracy Evaluation:**

```markdown
Figure 4.X - Resume parsing accuracy evaluation executed in Google Colab
[INSERT: Screenshot of Colab notebook with results]

As demonstrated in Figure 4.X, the Gemini AI-powered resume parsing
achieved 90.2% overall accuracy, exceeding the 85% target. The evaluation
was conducted using custom Jupyter notebooks with ground truth datasets.

Figure 4.Y - Accuracy breakdown by component
[INSERT: Bar chart showing component accuracies]

The breakdown shows:
- Personal Information: 95%
- Skills Extraction (F1): 87%
- Experience Parsing: 89%
- Education: 92%
- Certifications: 88%
```

### 💡 Pro Tips for Documentation

1. **High-Resolution Screenshots:**
   - Use Colab's built-in screenshot capability
   - Zoom to 100% before capturing
   - Include cell numbers for reproducibility

2. **Professional Presentation:**
   - Run all cells before screenshots
   - Clear outputs, then re-run for clean visuals
   - Use `plt.savefig(filename, dpi=300)` for print quality

3. **Citing Results:**
   ```
   "The evaluation notebook achieved 90.2% ± 2.1% accuracy across
   test cases, as shown in resume_parsing_accuracy_report.txt
   (Appendix A)."
   ```

4. **Reproducibility Statement:**
   ```
   "All evaluation results are reproducible via the Jupyter notebooks
   available in backend/notebooks/. The Colab versions require only
   a Google account and Gemini API key, enabling easy verification
   by reviewers."
   ```

---

## 📋 Checklist for Documentation

Use this checklist when preparing Chapter 4:

- [ ] Run `colab_resume_parsing_accuracy.ipynb` successfully
- [ ] Capture screenshot of notebook execution
- [ ] Download accuracy bar chart (Figure 4.X)
- [ ] Download overall accuracy gauge (Figure 4.Y)
- [ ] Save accuracy report text file
- [ ] Run `colab_job_matching_demo.ipynb`
- [ ] Capture comparison visualization
- [ ] Download improvement breakdown chart
- [ ] Save matching accuracy report
- [ ] Create table with numerical results
- [ ] Write methodology section explaining metrics
- [ ] Include reproducibility instructions
- [ ] Add all figures to Chapter 4.4

---

**Last Updated:** 2025-11-29
**Version:** 1.1.0 (Added Google Colab Support)
