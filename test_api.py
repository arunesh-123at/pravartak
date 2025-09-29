#!/usr/bin/env python3
"""
Test script to verify the API endpoints are working correctly
"""
import requests
import json
import sys

BASE_URL = "http://localhost:5001"

def test_health():
    """Test if the API is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_register_mentor():
    """Test mentor registration"""
    mentor_data = {
        "full_name": "Test Mentor",
        "email": "testmentor@example.com",
        "password": "password123",
        "expertise": "Computer Science"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register_mentor", json=mentor_data)
        result = response.json()
        print(f"Mentor registration: {response.status_code} - {result}")
        return result.get('success', False), result.get('mentor', {}).get('id')
    except Exception as e:
        print(f"Mentor registration failed: {e}")
        return False, None

def test_login(email, password):
    """Test login"""
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        result = response.json()
        print(f"Login: {response.status_code} - {result}")
        return result.get('success', False), result.get('user', {})
    except Exception as e:
        print(f"Login failed: {e}")
        return False, {}

def test_add_student(mentor_id):
    """Test adding a student"""
    student_data = {
        "full_name": "Test Student",
        "email": "teststudent@example.com",
        "account_type": "student",
        "current_cgpa": 7.5,
        "attendance_percentage": 85,
        "fee_status": "paid",
        "backlogs": 1,
        "mentor_id": mentor_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/add_student", json=student_data)
        result = response.json()
        print(f"Add student: {response.status_code} - {result}")
        return result.get('success', False), result.get('student', {}).get('id')
    except Exception as e:
        print(f"Add student failed: {e}")
        return False, None

def test_get_students(mentor_id):
    """Test getting students for a mentor"""
    try:
        response = requests.get(f"{BASE_URL}/get_students/{mentor_id}")
        result = response.json()
        print(f"Get students: {response.status_code} - {result}")
        return result.get('success', False), result.get('students', [])
    except Exception as e:
        print(f"Get students failed: {e}")
        return False, []

def test_update_student(student_id):
    """Test updating a student"""
    update_data = {
        "current_cgpa": 8.0,
        "attendance_percentage": 90,
        "fee_status": "paid",
        "backlogs": 0
    }
    
    try:
        response = requests.put(f"{BASE_URL}/update_student/{student_id}", json=update_data)
        result = response.json()
        print(f"Update student: {response.status_code} - {result}")
        return result.get('success', False)
    except Exception as e:
        print(f"Update student failed: {e}")
        return False

def test_predict_risk():
    """Test risk prediction"""
    risk_data = {
        "current_cgpa": 8.0,
        "attendance_percentage": 90,
        "fee_status": "paid",
        "backlogs": 0
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict-risk", json=risk_data)
        result = response.json()
        print(f"Predict risk: {response.status_code} - {result}")
        return result.get('success', False)
    except Exception as e:
        print(f"Predict risk failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=== API Test Suite ===")
    
    # Test 1: Health check
    if not test_health():
        print("❌ API is not running")
        sys.exit(1)
    print("✅ API is running")
    
    # Test 2: Register mentor
    success, mentor_id = test_register_mentor()
    if not success:
        print("❌ Mentor registration failed")
        return
    print(f"✅ Mentor registered with ID: {mentor_id}")
    
    # Test 3: Login
    success, user = test_login("testmentor@example.com", "password123")
    if not success:
        print("❌ Login failed")
        return
    print(f"✅ Login successful for: {user.get('full_name')}")
    
    # Test 4: Add student
    success, student_id = test_add_student(mentor_id)
    if not success:
        print("❌ Add student failed")
        return
    print(f"✅ Student added with ID: {student_id}")
    
    # Test 5: Get students
    success, students = test_get_students(mentor_id)
    if not success:
        print("❌ Get students failed")
        return
    print(f"✅ Retrieved {len(students)} students")
    
    # Test 6: Update student
    success = test_update_student(student_id)
    if not success:
        print("❌ Update student failed")
        return
    print("✅ Student updated successfully")
    
    # Test 7: Predict risk
    success = test_predict_risk()
    if not success:
        print("❌ Risk prediction failed")
        return
    print("✅ Risk prediction successful")
    
    print("\n🎉 All tests passed!")

if __name__ == "__main__":
    main()