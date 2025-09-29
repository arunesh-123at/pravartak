import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import joblib
import mysql.connector
from mysql.connector import pooling


load_dotenv()

DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_NAME = os.getenv('DB_NAME', 'pravartak')
DEFAULT_STUDENT_PASSWORD = os.getenv('DEFAULT_STUDENT_PASSWORD', 'password')

connection_pool = pooling.MySQLConnectionPool(
    pool_name="pravartak_pool",
    pool_size=5,
    pool_reset_session=True,
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
    autocommit=False,
)


def get_conn():
    return connection_pool.get_connection()


def ensure_tables_exist():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS mentors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                expertise VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                account_type VARCHAR(50) NOT NULL,
                parent_name VARCHAR(255) NULL,
                parent_email VARCHAR(255) NULL,
                current_cgpa FLOAT NOT NULL,
                attendance_percentage FLOAT NOT NULL,
                fee_status VARCHAR(50) NOT NULL,
                backlogs INT NOT NULL,
                mentor_id INT NOT NULL,
                CONSTRAINT uq_students_email UNIQUE (email),
                CONSTRAINT fk_students_mentor FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        # Ensure legacy tables get the password column (robust check without IF NOT EXISTS)
        try:
            cur.execute(
                """
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA=%s AND TABLE_NAME='students' AND COLUMN_NAME='password'
                """,
                (DB_NAME,)
            )
            exists = cur.fetchone()[0]
            if exists == 0:
                cur.execute("ALTER TABLE students ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ''")
        except Exception:
            # Ignore if not able to introspect; subsequent INSERT will fail and surface error
            pass
        conn.commit()
    finally:
        cur.close()
        conn.close()


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Ensure tables exist
    ensure_tables_exist()

    # Load AI models once at startup
    model_path_default = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model', 'model_pipeline.joblib')
    model_path = os.getenv('MODEL_PATH', model_path_default)
    model = None
    try:
        model = joblib.load(model_path)
    except Exception:
        model = None

    # Load risk model for /predict-risk
    risk_model_default = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model', 'risk_model.pkl')
    risk_model_path = os.getenv('RISK_MODEL_PATH', risk_model_default)
    risk_model = None
    try:
        risk_model = joblib.load(risk_model_path)
    except Exception:
        risk_model = None

    def get_db_conn():
        return get_conn()

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok'}), 200

    @app.route('/model-info', methods=['GET'])
    def model_info():
        # Report availability of models and simple metadata for debugging
        info = {
            'risk_model_loaded': risk_model is not None,
            'risk_model_path': risk_model_path,
            'risk_model_class': type(risk_model).__name__ if risk_model is not None else None,
            'dropout_model_loaded': model is not None,
            'dropout_model_path': model_path,
            'dropout_model_class': type(model).__name__ if model is not None else None,
        }
        return jsonify({'success': True, 'info': info}), 200

    @app.route('/register_mentor', methods=['POST'])
    def register_mentor():
        payload = request.get_json(silent=True) or {}
        required = ['full_name', 'email', 'password', 'expertise']
        missing = [f for f in required if not payload.get(f)]
        if missing:
            return jsonify({'success': False, 'error': f"Missing fields: {', '.join(missing)}"}), 400

        # Validate email format
        email = payload['email'].strip().lower()
        if '@' not in email or '.' not in email.split('@')[1]:
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400

        # Validate password strength
        password = payload['password']
        if len(password) < 6:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters long'}), 400

        # Validate full name
        full_name = payload['full_name'].strip()
        if len(full_name) < 2:
            return jsonify({'success': False, 'error': 'Full name must be at least 2 characters long'}), 400

        # Validate expertise
        expertise = payload['expertise'].strip()
        if len(expertise) < 2:
            return jsonify({'success': False, 'error': 'Expertise must be at least 2 characters long'}), 400

        conn = get_db_conn()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT id FROM mentors WHERE email=%s", (email,))
            existing = cur.fetchone()
            if existing:
                return jsonify({'success': False, 'error': 'Email already registered'}), 409

            hashed = generate_password_hash(password)
            cur.execute(
                """
                INSERT INTO mentors (full_name, email, password, expertise)
                VALUES (%s, %s, %s, %s)
                """,
                (full_name, email, hashed, expertise)
            )
            conn.commit()
            mentor_id = cur.lastrowid
            return jsonify({'success': True, 'mentor': {
                'id': mentor_id,
                'full_name': full_name,
                'email': email,
                'expertise': expertise,
            }}), 201
        except Exception:
            conn.rollback()
            return jsonify({'success': False, 'error': 'Server error'}), 500
        finally:
            cur.close()
            conn.close()

    @app.route('/login', methods=['POST'])
    def login():
        payload = request.get_json(silent=True) or {}
        email = (payload.get('email') or '').strip().lower()
        password = payload.get('password') or ''
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password required'}), 400

        conn = get_db_conn()
        try:
            cur = conn.cursor(dictionary=True)
            # Try mentor first
            cur.execute("SELECT id, full_name, email, password, expertise FROM mentors WHERE email=%s", (email,))
            row = cur.fetchone()
            if row and check_password_hash(row['password'], password):
                return jsonify({'success': True, 'user': {
                    'id': row['id'],
                    'full_name': row['full_name'],
                    'email': row['email'],
                    'role': 'mentor',
                    'expertise': row['expertise'],
                }}), 200

            # Try student
            cur.execute("SELECT id, full_name, email, password FROM students WHERE email=%s", (email,))
            s = cur.fetchone()
            if s and s['password'] and check_password_hash(s['password'], password):
                return jsonify({'success': True, 'user': {
                    'id': s['id'],
                    'full_name': s['full_name'],
                    'email': s['email'],
                    'role': 'student',
                }}), 200

            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        finally:
            cur.close()
            conn.close()

    @app.route('/add_student', methods=['POST'])
    def add_student():
        payload = request.get_json(silent=True) or {}
        required = ['full_name', 'email', 'account_type', 'current_cgpa', 'attendance_percentage', 'fee_status', 'backlogs', 'mentor_id']
        missing = [f for f in required if payload.get(f) in [None, '']]
        if missing:
            return jsonify({'success': False, 'error': f"Missing fields: {', '.join(missing)}"}), 400

        if payload['account_type'] not in ['student', 'student_and_parent']:
            return jsonify({'success': False, 'error': 'Invalid account_type'}), 400

        if payload['fee_status'] not in ['paid', 'payment_pending', 'payment_overdue']:
            return jsonify({'success': False, 'error': 'Invalid fee_status'}), 400

        try:
            cgpa = float(payload['current_cgpa'])
            attendance = float(payload['attendance_percentage'])
            backlogs = int(payload['backlogs'])
        except Exception:
            return jsonify({'success': False, 'error': 'Invalid numeric fields'}), 400

        conn = get_db_conn()
        try:
            cur = conn.cursor(dictionary=True)
            # Validate mentor
            cur.execute("SELECT id FROM mentors WHERE id=%s", (int(payload['mentor_id']),))
            if not cur.fetchone():
                return jsonify({'success': False, 'error': 'Mentor not found'}), 404

            # Check duplicate student email
            cur.execute("SELECT id FROM students WHERE email=%s", (payload['email'].strip().lower(),))
            if cur.fetchone():
                return jsonify({'success': False, 'error': 'Student email already exists'}), 409

            cur.execute(
                """
                INSERT INTO students (
                    full_name, email, password, account_type, parent_name, parent_email,
                    current_cgpa, attendance_percentage, fee_status, backlogs, mentor_id
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    payload['full_name'].strip(),
                    payload['email'].strip().lower(),
                    generate_password_hash(DEFAULT_STUDENT_PASSWORD),
                    payload['account_type'],
                    (payload.get('parent_name') or None),
                    (payload.get('parent_email') or None),
                    cgpa,
                    attendance,
                    payload['fee_status'],
                    backlogs,
                    int(payload['mentor_id'])
                )
            )
            conn.commit()
            new_id = cur.lastrowid

            # Fetch inserted student
            cur.execute("SELECT * FROM students WHERE id=%s", (new_id,))
            s = cur.fetchone()
            return jsonify({'success': True, 'student': {
                'id': s['id'],
                'full_name': s['full_name'],
                'email': s['email'],
                'account_type': s['account_type'],
                'parent_name': s['parent_name'],
                'parent_email': s['parent_email'],
                'current_cgpa': float(s['current_cgpa']),
                'attendance_percentage': float(s['attendance_percentage']),
                'fee_status': s['fee_status'],
                'backlogs': int(s['backlogs']),
                'mentor_id': int(s['mentor_id']),
            }}), 201
        except Exception:
            conn.rollback()
            return jsonify({'success': False, 'error': 'Server error'}), 500
        finally:
            cur.close()
            conn.close()

    @app.route('/get_students/<int:mentor_id>', methods=['GET'])
    def get_students(mentor_id: int):
        conn = get_db_conn()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT id FROM mentors WHERE id=%s", (mentor_id,))
            if not cur.fetchone():
                return jsonify({'success': False, 'error': 'Mentor not found'}), 404

            cur.execute("SELECT * FROM students WHERE mentor_id=%s", (mentor_id,))
            students = cur.fetchall()
            return jsonify({'success': True, 'students': [
                {
                    'id': s['id'],
                    'full_name': s['full_name'],
                    'email': s['email'],
                    'account_type': s['account_type'],
                    'parent_name': s['parent_name'],
                    'parent_email': s['parent_email'],
                    'current_cgpa': float(s['current_cgpa']),
                    'attendance_percentage': float(s['attendance_percentage']),
                    'fee_status': s['fee_status'],
                    'backlogs': int(s['backlogs']),
                    'mentor_id': int(s['mentor_id']),
                } for s in students
            ]}), 200
        finally:
            cur.close()
            conn.close()

    @app.route('/get_student/<int:student_id>', methods=['GET'])
    def get_student(student_id: int):
        conn = get_db_conn()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT * FROM students WHERE id=%s", (student_id,))
            s = cur.fetchone()
            if not s:
                return jsonify({'success': False, 'error': 'Student not found'}), 404
            return jsonify({'success': True, 'student': {
                'id': s['id'],
                'full_name': s['full_name'],
                'email': s['email'],
                'account_type': s['account_type'],
                'parent_name': s['parent_name'],
                'parent_email': s['parent_email'],
                'current_cgpa': float(s['current_cgpa']),
                'attendance_percentage': float(s['attendance_percentage']),
                'fee_status': s['fee_status'],
                'backlogs': int(s['backlogs']),
                'mentor_id': int(s['mentor_id']),
            }}), 200
        finally:
            cur.close()
            conn.close()

    @app.route('/update_student/<int:student_id>', methods=['PUT'])
    def update_student(student_id: int):
        payload = request.get_json(silent=True) or {}
        allowed = ['current_cgpa', 'attendance_percentage', 'fee_status', 'backlogs']
        updates = {k: payload.get(k) for k in allowed if payload.get(k) is not None}
        if not updates:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400

        if 'fee_status' in updates and updates['fee_status'] not in ['paid', 'payment_pending', 'payment_overdue']:
            return jsonify({'success': False, 'error': 'Invalid fee_status'}), 400
        try:
            if 'current_cgpa' in updates:
                updates['current_cgpa'] = float(updates['current_cgpa'])
            if 'attendance_percentage' in updates:
                updates['attendance_percentage'] = float(updates['attendance_percentage'])
            if 'backlogs' in updates:
                updates['backlogs'] = int(updates['backlogs'])
        except Exception:
            return jsonify({'success': False, 'error': 'Invalid numeric fields'}), 400

        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("SELECT id FROM students WHERE id=%s", (student_id,))
            if not cur.fetchone():
                return jsonify({'success': False, 'error': 'Student not found'}), 404

            set_clauses = []
            values = []
            for k, v in updates.items():
                set_clauses.append(f"{k}=%s")
                values.append(v)
            values.append(student_id)

            sql = f"UPDATE students SET {', '.join(set_clauses)} WHERE id=%s"
            cur.execute(sql, tuple(values))
            conn.commit()
            return jsonify({'success': True}), 200
        except Exception:
            conn.rollback()
            return jsonify({'success': False, 'error': 'Update failed'}), 500
        finally:
            cur.close()
            conn.close()

    @app.route('/predict_dropout', methods=['POST'])
    def predict_dropout():
        if model is None:
            return jsonify({'success': False, 'error': 'Model not available'}), 500

        payload = request.get_json(silent=True) or {}
        required = ['current_cgpa', 'attendance_percentage', 'fee_status', 'backlogs']
        missing = [f for f in required if payload.get(f) in [None, '']]
        if missing:
            return jsonify({'success': False, 'error': f"Missing fields: {', '.join(missing)}"}), 400

        try:
            cgpa = float(payload['current_cgpa'])
            attendance = float(payload['attendance_percentage'])
            backlogs = int(payload['backlogs'])
            fee_status = payload['fee_status']
        except Exception:
            return jsonify({'success': False, 'error': 'Invalid numeric fields'}), 400

        fee_map = {
            'paid': 0,
            'payment_pending': 1,
            'payment_overdue': 2,
        }
        if fee_status not in fee_map:
            return jsonify({'success': False, 'error': 'Invalid fee_status'}), 400

        try:
            import pandas as pd
            
            # Create a DataFrame with the expected columns
            data = {
                'Name': ['Student'],  # Default value
                'Roll No': [1],  # Default value
                'Gender': ['Male'],  # Default value
                'Category': ['General'],  # Default value
                'Fees_Status': [fee_status],  # Use the actual fee status
                'Attendance': [attendance],
                'Marks': [cgpa * 10],  # Convert CGPA to marks
                'Backlog': [backlogs]
            }
            
            df = pd.DataFrame(data)
            pred = model.predict(df)[0]
            prob = None
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(df)[0]
                prob = float(max(proba))
            return jsonify({'success': True, 'prediction': int(pred), 'probability': prob}), 200
        except Exception:
            return jsonify({'success': False, 'error': 'Prediction failed'}), 500

    @app.route('/predict-risk', methods=['POST'])
    def predict_risk():
        # Use the same model as predict_dropout for risk assessment
        if model is None:
            return jsonify({'success': False, 'error': 'Risk model not available'}), 500

        payload = request.get_json(silent=True) or {}
        # Accept both old and new field names for compatibility
        cgpa = payload.get('current_cgpa', payload.get('cgpa'))
        attendance = payload.get('attendance_percentage', payload.get('attendance'))
        fee_status = payload.get('fee_status')  # expected: 'paid' | 'payment_pending' | 'payment_overdue'
        backlogs = payload.get('backlogs')

        if cgpa in [None, ''] or attendance in [None, ''] or backlogs in [None, ''] or fee_status in [None, '']:
            return jsonify({'success': False, 'error': 'Missing required fields: cgpa/attendance/backlogs/fee_status'}), 400

        try:
            cgpa = float(cgpa)
            attendance = float(attendance)
            backlogs = int(backlogs)
        except Exception:
            return jsonify({'success': False, 'error': 'Invalid numeric fields'}), 400

        fee_map = {
            'paid': 0,
            'payment_pending': 1,
            'payment_overdue': 2,
        }
        if fee_status not in fee_map:
            return jsonify({'success': False, 'error': 'Invalid fee_status'}), 400

        try:
            import pandas as pd
            
            # Map our API parameters to the model's expected features
            # The model expects: ['Name', 'Roll No', 'Gender', 'Category', 'Fees_Status', 'Attendance', 'Marks', 'Backlog']
            
            # Create a DataFrame with the expected columns
            data = {
                'Name': ['Student'],  # Default value
                'Roll No': [1],  # Default value
                'Gender': ['Male'],  # Default value
                'Category': ['General'],  # Default value
                'Fees_Status': [fee_status],  # Use the actual fee status
                'Attendance': [attendance],
                'Marks': [cgpa * 10],  # Convert CGPA to marks (assuming CGPA is out of 10, marks out of 100)
                'Backlog': [backlogs]
            }
            
            df = pd.DataFrame(data)
            
            # Get prediction (0 = no dropout, 1 = dropout)
            pred = model.predict(df)[0]
            
            # Convert binary prediction to risk levels
            # Get probability if available
            prob = None
            if hasattr(model, 'predict_proba'):
                try:
                    proba = model.predict_proba(df)[0]
                    prob = float(proba[1])  # Probability of dropout
                except:
                    prob = 0.5 if pred == 1 else 0.2
            else:
                # Fallback: estimate probability based on features
                prob = 0.5 if pred == 1 else 0.2
            
            # Map probability to risk levels
            if prob >= 0.7:
                risk_level = 'High'
            elif prob >= 0.4:
                risk_level = 'Medium'
            else:
                risk_level = 'Low'

            return jsonify({'success': True, 'risk_level': risk_level}), 200
        except Exception as e:
            # More detailed error logging
            print(f"Risk prediction error: {str(e)}")
            return jsonify({'success': False, 'error': f'Risk prediction failed: {str(e)}'}), 500

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)


