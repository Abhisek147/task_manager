# task_manager
 Task Management Web Application helps individuals and teams organize, prioritize, and track their daily tasks efficiently. Built using Python Flask for the backend, MySQL for the database, and vanilla JavaScript for the frontend.


## Setup Instructions

### 1. Database Setup
```sql
CREATE DATABASE task_management;
```

### 2. Install Dependencies
```bash
cd backend
pip install -r ../requirements.txt
```

### 3. Configure Database
Edit `backend/db.py` with your MySQL credentials:
```python
self.host = 'localhost'
self.database = 'task_management'
self.user = 'your_username'
self.password = 'your_password'
```

### 4. Run Application
```bash
cd backend
python app.py
```

### 5. Access Application
Open browser to: `http://localhost:5000`
