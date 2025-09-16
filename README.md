# Student Dropout Prediction System

A full-stack web application that predicts student dropout risk using machine learning. The system consists of a React frontend, Flask backend, and machine learning models for risk assessment.

> **Original Design**: This project is based on the Figma design available at [Student Dropout Prediction App](https://www.figma.com/design/GW1wS1OOio8uuq1yjK5EmP/Student-Dropout-Prediction-App)

## 🏗️ Project Structure

```
pravartak-main/
├── backend/           # Flask API server
├── frontend/          # React frontend application
├── model/            # Machine learning training scripts
├── .gitignore        # Consolidated git ignore rules
├── .env.example      # Environment variable templates
├── setup.sh          # Automated setup script
├── SECURITY.md       # Security guidelines and checklist
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ (for backend and ML model)
- Node.js 16+ (for frontend)
- MySQL 8.0+ (for database)

### 1. Database Setup

1. Install and start MySQL
2. Create database:
   ```sql
   CREATE DATABASE pravartak;
   ```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run the server
python app.py
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env if you need to change the API endpoint

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Machine Learning Model (Optional)

```bash
# Navigate to model directory
cd model

# Install dependencies
pip install -r requirements.txt

# Train model (requires dataset)
python train.py
```

## ⚙️ Configuration

### Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# Database Configuration
DB_USER=root
DB_PASSWORD=your_database_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=pravartak

# Application Configuration
PORT=5000
DEFAULT_STUDENT_PASSWORD=secure_password_here

# Model Configuration
MODEL_PATH=../model/model_pipeline.joblib
RISK_MODEL_PATH=../model/risk_model.pkl

# Flask Configuration (for production)
FLASK_ENV=production
FLASK_DEBUG=False
```

**Available Environment Variables:**
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` - Database connection
- `MODEL_PATH` - Path to dropout prediction model (defaults to ../model/model_pipeline.joblib)
- `RISK_MODEL_PATH` - Path to risk assessment model (defaults to ../model/risk_model.pkl)
- `PORT` - Flask server port (default: 5000)
- `DEFAULT_STUDENT_PASSWORD` - Default password for new students

### Frontend Environment Variables

Copy `frontend/.env.example` to `frontend/.env`:

```env
# API Configuration
VITE_API_BASE=http://localhost:5000
```

**Note**: The frontend defaults to `http://localhost:5000` if no environment variable is set.

### Quick Commands Reference

```bash
# Backend Setup (from project root)
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your database credentials
python app.py

# Frontend Setup (from project root)
cd frontend
npm i  # or npm install
cp .env.example .env  # Optional, defaults work for local development
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /login` - User login
- `POST /register_mentor` - Register new mentor

### Student Management
- `POST /add_student` - Add new student
- `GET /get_students/{mentor_id}` - Get students by mentor
- `GET /get_student/{student_id}` - Get specific student
- `PUT /update_student/{student_id}` - Update student data

### Prediction Endpoints
- `POST /predict_dropout` - Predict dropout probability
- `POST /predict-risk` - Predict risk level

### Health Check
- `GET /health` - Check server status
- `GET /model-info` - Check model availability

## 🛡️ Security Features

- Password hashing using Werkzeug
- Environment variables for sensitive data
- CORS protection
- SQL injection prevention with parameterized queries
- Input validation and sanitization

## 🏛️ Database Schema

### Mentors Table
```sql
CREATE TABLE mentors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    expertise VARCHAR(255) NOT NULL
);
```

### Students Table
```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    parent_name VARCHAR(255) NULL,
    parent_email VARCHAR(255) NULL,
    current_cgpa FLOAT NOT NULL,
    attendance_percentage FLOAT NOT NULL,
    fee_status VARCHAR(50) NOT NULL,
    backlogs INT NOT NULL,
    mentor_id INT NOT NULL,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id)
);
```

## 🔧 Development

### Backend Development
- Flask framework with SQLAlchemy
- MySQL database with connection pooling
- scikit-learn for machine learning
- RESTful API design

### Frontend Development
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- Recharts for data visualization

### Code Style
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/TypeScript
- Meaningful commit messages
- Feature branch workflow

## 📦 Production Deployment

### Backend
1. Set `FLASK_ENV=production`
2. Use production database
3. Set up reverse proxy (nginx)
4. Use WSGI server (gunicorn)

### Frontend
1. Run `npm run build`
2. Serve static files from `dist/` directory
3. Configure environment variables for production API

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists

**Model Loading Error**
- Train the model first using `model/train.py`
- Check model file paths in environment variables

**CORS Issues**
- Verify frontend URL is allowed in CORS configuration
- Check API base URL in frontend configuration

### Getting Help

For technical support or questions:
1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include error logs and system information