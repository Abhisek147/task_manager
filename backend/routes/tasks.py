from flask import Blueprint, request, jsonify
from controllers.tasksController import tasks_controller

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = tasks_controller.get_all_tasks()
    return jsonify(tasks)

@tasks_bp.route('/tasks', methods=['POST'])
def create_task():
    try:
        data = request.json
        if not data or not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
            
        task_id = tasks_controller.create_task(data)
        if task_id:
            return jsonify({'id': task_id, 'message': 'Task created successfully'}), 201
        return jsonify({'error': 'Failed to create task'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    success = tasks_controller.update_task(task_id, data)
    if success:
        return jsonify({'message': 'Task updated successfully'})
    return jsonify({'error': 'Failed to update task'}), 500

@tasks_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    success = tasks_controller.delete_task(task_id)
    if success:
        return jsonify({'message': 'Task deleted successfully'})
    return jsonify({'error': 'Failed to delete task'}), 500

@tasks_bp.route('/tasks/reorder', methods=['PUT'])
def reorder_tasks():
    data = request.json
    success = tasks_controller.reorder_tasks(data)
    if success:
        return jsonify({'message': 'Tasks reordered successfully'})
    return jsonify({'error': 'Failed to reorder tasks'}), 500

@tasks_bp.route('/dashboard/stats', methods=['GET'])
def dashboard_stats():
    stats = tasks_controller.get_dashboard_stats()
    return jsonify(stats)