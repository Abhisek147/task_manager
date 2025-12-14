from db import db
from datetime import date

class TasksController:
    def get_all_tasks(self):
        connection = db.get_connection()
        if not connection:
            return []
        
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM tasks ORDER BY order_index, created_at DESC")
        tasks = cursor.fetchall()
        
        # Convert sqlite3.Row to dict
        tasks = [dict(task) for task in tasks]
        
        for task in tasks:
            if task['due_date']:
                task['due_date'] = str(task['due_date'])
            if task['created_at']:
                task['created_at'] = str(task['created_at'])
        
        cursor.close()
        connection.close()
        return tasks
    
    def create_task(self, data):
        connection = db.get_connection()
        if not connection:
            return None
        
        try:
            cursor = connection.cursor()
            
            # Get next order index
            cursor.execute("SELECT COALESCE(MAX(order_index), 0) + 1 FROM tasks")
            next_order = cursor.fetchone()[0]
            
            # Handle empty date
            due_date = data.get('due_date')
            if due_date == '' or due_date is None:
                due_date = None
            
            # Handle empty category
            category = data.get('category', '')
            if category == '':
                category = None
                
            query = """
                INSERT INTO tasks (title, description, priority, category, due_date, status, order_index)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            
            values = (
                data['title'],
                data.get('description', ''),
                data.get('priority', 'Medium'),
                category,
                due_date,
                data.get('status', 'pending'),
                next_order
            )
            
            cursor.execute(query, values)
            task_id = cursor.lastrowid
            connection.commit()
            cursor.close()
            connection.close()
            return task_id
            
        except Exception as e:
            connection.rollback()
            cursor.close()
            connection.close()
            return None
    
    def update_task(self, task_id, data):
        connection = db.get_connection()
        if not connection:
            return False
        
        cursor = connection.cursor()
        query = """
            UPDATE tasks SET title=?, description=?, priority=?, 
            category=?, due_date=?, status=? WHERE id=?
        """
        
        due_date = data.get('due_date')
        if due_date == '':
            due_date = None
            
        values = (
            data['title'],
            data.get('description', ''),
            data.get('priority', 'Medium'),
            data.get('category', ''),
            due_date,
            data.get('status', 'pending'),
            task_id
        )
        
        cursor.execute(query, values)
        connection.commit()
        cursor.close()
        connection.close()
        
        return True
    
    def delete_task(self, task_id):
        connection = db.get_connection()
        if not connection:
            return False
        
        cursor = connection.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        connection.commit()
        cursor.close()
        connection.close()
        
        return True
    
    def reorder_tasks(self, task_orders):
        connection = db.get_connection()
        if not connection:
            return False
        
        cursor = connection.cursor()
        for task_id, order_index in task_orders.items():
            cursor.execute("UPDATE tasks SET order_index = ? WHERE id = ?", (order_index, task_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return True
    

    
    def get_dashboard_stats(self):
        connection = db.get_connection()
        if not connection:
            return {}
        
        cursor = connection.cursor()
        today = date.today()
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE due_date = ? AND status = 'pending'", (today,))
        due_today = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE due_date < ? AND status = 'pending'", (today,))
        overdue = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'completed'")
        completed = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'pending'")
        pending = cursor.fetchone()[0]
        
        cursor.close()
        connection.close()
        
        return {
            'due_today': due_today,
            'overdue': overdue,
            'completed': completed,
            'pending': pending
        }

tasks_controller = TasksController()