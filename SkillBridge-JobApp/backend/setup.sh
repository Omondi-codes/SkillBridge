#!/bin/bash
# SkillBridge Backend Setup Script

set -e

echo "🚀 SkillBridge Backend Setup"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo -e "\n${YELLOW}Checking Python version...${NC}"
python3 --version

# Create virtual environment
echo -e "\n${YELLOW}Creating virtual environment...${NC}"
python3 -m venv venv

# Activate virtual environment
echo -e "\n${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "\n${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
pip install -r requirements.txt

# Download spaCy model
echo -e "\n${YELLOW}Downloading spaCy model...${NC}"
python -m spacy download en_core_web_sm

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created. Please edit it with your credentials.${NC}"
else
    echo -e "\n${GREEN}✓ .env file already exists.${NC}"
fi

# Create uploads directory
echo -e "\n${YELLOW}Creating uploads directory...${NC}"
mkdir -p uploads

# Database setup instructions
echo -e "\n${YELLOW}Database Setup Instructions:${NC}"
echo "1. Ensure PostgreSQL is running:"
echo "   createdb skillbridge"
echo ""
echo "2. Ensure MongoDB is running"
echo ""
echo "3. Start Qdrant with Docker:"
echo "   docker run -p 6333:6333 -v \$(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant"
echo ""
echo "4. Ensure Redis is running:"
echo "   redis-server"
echo ""

# Flask migrations
echo -e "\n${YELLOW}Would you like to run database migrations? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Running database migrations...${NC}"
    export FLASK_APP=app.py
    flask db init || true
    flask db migrate -m "Initial migration" || true
    flask db upgrade
    echo -e "${GREEN}✓ Database migrations completed${NC}"
fi

# Initialize Qdrant
echo -e "\n${YELLOW}Would you like to initialize Qdrant collections? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Initializing Qdrant...${NC}"
    python scripts/init_qdrant.py
    echo -e "${GREEN}✓ Qdrant collections initialized${NC}"
fi

# Seed database
echo -e "\n${YELLOW}Would you like to seed the database with sample data? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Seeding database...${NC}"
    python scripts/seed_database.py
    echo -e "${GREEN}✓ Database seeded${NC}"
fi

echo -e "\n${GREEN}=============================="
echo -e "✓ Setup completed successfully!"
echo -e "==============================${NC}"

echo -e "\nTo start the application:"
echo -e "  ${YELLOW}source venv/bin/activate${NC}"
echo -e "  ${YELLOW}python app.py${NC}"
echo ""
echo -e "In separate terminals:"
echo -e "  ${YELLOW}celery -A celery_app worker --loglevel=info${NC}"
echo -e "  ${YELLOW}celery -A celery_app beat --loglevel=info${NC}"
