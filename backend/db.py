import sqlite3
import os

class Database:
    def __init__(self):
        self.db_path = 'task_management.db'
        
    def get_connection(self):
        try:
            connection = sqlite3.connect(self.db_path)
            connection.row_factory = sqlite3.Row
            return connection
        except Exception as e:
            return None
    
    def init_database(self):
        try:
            connection = sqlite3.connect(self.db_path)
            cursor = connection.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    priority TEXT DEFAULT 'Medium',
                    category TEXT,
                    due_date DATE,
                    status TEXT DEFAULT 'pending',
                    order_index INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert default categories
            default_categories = ['Work', 'Personal', 'Shopping', 'Health']
            for category in default_categories:
                try:
                    cursor.execute("INSERT INTO categories (name) VALUES (?)", (category,))
                except sqlite3.IntegrityError:
                    pass
            
            connection.commit()
            cursor.close()
            connection.close()
        except Exception as e:
            pass
            


db = Database()