#!/bin/bash

# Setup script for Student Dropout Prediction System
# This script helps set up the development environment

echo "🚀 Setting up Student Dropout Prediction System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking prerequisites..."

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d" " -f2)
    print_status "Python found: $PYTHON_VERSION"
else
    print_error "Python 3 is required but not found. Please install Python 3.8+"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is required but not found. Please install Node.js 16+"
    exit 1
fi

# Check MySQL
if command -v mysql &> /dev/null; then
    print_status "MySQL found"
else
    print_warning "MySQL not found in PATH. Please ensure MySQL is installed and running"
fi

# Setup backend
print_status "Setting up backend environment..."

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_status "Creating backend .env file from example..."
        cp .env.example .env
        print_warning "Please edit backend/.env with your actual database credentials"
    else
        print_error "backend/.env.example not found"
    fi
else
    print_status "Backend .env file already exists"
fi

cd ..

# Setup frontend
print_status "Setting up frontend environment..."

cd frontend

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_status "Creating frontend .env file from example..."
        cp .env.example .env
        print_status "Frontend .env configured with default values"
    else
        print_error "frontend/.env.example not found"
    fi
else
    print_status "Frontend .env file already exists"
fi

cd ..

# Installation instructions
echo ""
print_status "Environment setup complete! Next steps:"
echo ""
echo "1. Configure your database:"
echo "   - Start MySQL server"
echo "   - Create database: CREATE DATABASE pravartak;"
echo "   - Edit backend/.env with your database credentials"
echo ""
echo "2. Install backend dependencies:"
echo "   cd backend"
echo "   source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate"
echo "   pip install -r requirements.txt"
echo ""
echo "3. Install frontend dependencies:"
echo "   cd frontend"
echo "   npm install"
echo ""
echo "4. Start the applications:"
echo "   Backend:  cd backend && python app.py"
echo "   Frontend: cd frontend && npm run dev"
echo ""
print_status "Setup script completed successfully!"
print_warning "Remember to review and update the .env files with your actual configuration"