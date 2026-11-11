# How to Start SkillBridge Backend

## ✅ spaCy is Already Installed!

spaCy and the English model (`en_core_web_sm`) are installed in your virtual environment at `venv/`.

## 🚀 Starting the Application

### Option 1: Use the Start Script (Easiest)

```bash
./start_server.sh
```

This script automatically uses the virtual environment.

### Option 2: Manual Start with venv

```bash
# Activate virtual environment
source venv/bin/activate

# Run the app
python app.py

# Or export FLASK_APP first
export FLASK_APP=app.py
flask run
```

### Option 3: Direct venv Python (No activation needed)

```bash
venv/bin/python app.py
```

## ❌ Don't Run This Way

```bash
# This WON'T work - uses system Python without packages
python app.py
python3 app.py
```

## 🔧 Verifying Installation

Check if spaCy is available:

```bash
# With venv activated
source venv/bin/activate
python -c "import spacy; print('✓ spaCy installed:', spacy.__version__)"
python -m spacy info en_core_web_sm

# Or directly
venv/bin/python -c "import spacy; print('✓ spaCy installed:', spacy.__version__)"
```

## 📦 What's Installed in venv

Your virtual environment has:
- ✅ spacy (3.8.7)
- ✅ en_core_web_sm (English model)
- All other dependencies from requirements.txt

## 🎯 Complete Startup Workflow

### Terminal 1: Start Flask Server
```bash
./start_server.sh
# Or: venv/bin/python app.py
```

### Terminal 2: Start Celery Worker
```bash
source venv/bin/activate
celery -A celery_app worker --loglevel=info
```

### Terminal 3: Start Celery Beat (Optional)
```bash
source venv/bin/activate
celery -A celery_app beat --loglevel=info
```

## 🐛 Troubleshooting

### "spaCy model not found"
This happens when you run with system Python instead of venv Python.

**Solution:** Use `venv/bin/python app.py` or `./start_server.sh`

### "ModuleNotFoundError: No module named 'spacy'"
You're using system Python instead of venv Python.

**Solution:** Always use venv:
```bash
source venv/bin/activate
python app.py
```

### Installing More Packages
Always install to venv:
```bash
source venv/bin/activate
pip install package-name

# Or directly
venv/bin/pip install package-name
```

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Start server | `./start_server.sh` |
| Start with venv | `venv/bin/python app.py` |
| Install package | `venv/bin/pip install package` |
| Check spaCy | `venv/bin/python -m spacy info` |
| Run tests | `venv/bin/python tests/comprehensive_test.py` |

---

**Always use the virtual environment to ensure all packages are available! 🎯**
