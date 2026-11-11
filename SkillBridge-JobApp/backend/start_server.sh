#!/bin/bash
# Start SkillBridge Flask server using virtual environment

cd "$(dirname "$0")"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                 SKILLBRIDGE SERVER STARTING                        ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found!"
    echo ""
    echo "Please run: python3 -m venv .venv"
    echo "Then: .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# Activate .venv and run
echo "✓ Using virtual environment (.venv)"
echo "✓ Python version: $(.venv/bin/python --version)"
echo ""

export FLASK_APP=app.py
export FLASK_ENV=development

echo "Starting Flask server..."
echo "API will be available at: http://localhost:5000"
echo "Press CTRL+C to stop"
echo ""

.venv/bin/python app.py
