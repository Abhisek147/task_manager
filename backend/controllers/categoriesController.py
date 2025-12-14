from db import db

class CategoriesController:
    def get_all_categories(self):
        connection = db.get_connection()
        if not connection:
            return []
        
        try:
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM categories ORDER BY name")
            categories = cursor.fetchall()
            
            # Convert sqlite3.Row to dict
            categories = [dict(category) for category in categories]
            
            cursor.close()
            connection.close()
            return categories
            
        except Exception as e:
            print(f"Error getting categories: {e}")
            if cursor:
                cursor.close()
            if connection:
                connection.close()
            return []
    
    def create_category(self, name):
        connection = db.get_connection()
        if not connection:
            return None
        
        try:
            cursor = connection.cursor()
            cursor.execute("INSERT INTO categories (name) VALUES (?)", (name,))
            category_id = cursor.lastrowid
            connection.commit()
            cursor.close()
            connection.close()
            print(f"Category '{name}' created with ID: {category_id}")
            return category_id
        except Exception as e:
            print(f"Error creating category: {e}")
            if connection:
                connection.rollback()
            if cursor:
                cursor.close()
            if connection:
                connection.close()
            return None

categories_controller = CategoriesController()