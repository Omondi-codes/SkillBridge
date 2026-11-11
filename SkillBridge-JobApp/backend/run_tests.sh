#!/bin/bash
# SkillBridge Comprehensive Test Runner

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║        SKILLBRIDGE COMPREHENSIVE TEST RUNNER                       ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "Checking if Flask server is running..."
if ! curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "❌ Flask server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "  python app.py"
    echo ""
    exit 1
fi

echo "✓ Server is running"
echo ""

# Install requests if needed
echo "Checking dependencies..."
if ! python3 -c "import requests" 2>/dev/null; then
    echo "Installing requests library..."
    pip install requests --quiet
fi

echo "✓ Dependencies OK"
echo ""

# Run the comprehensive test
echo "Starting comprehensive tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 tests/comprehensive_test.py

exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                    ║"
    echo "║                  ✓ ALL TESTS PASSED! 🎉                           ║"
    echo "║                                                                    ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
else
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                    ║"
    echo "║                  ✗ SOME TESTS FAILED                              ║"
    echo "║                                                                    ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
fi

exit $exit_code
