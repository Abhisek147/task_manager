from flask import Blueprint, request, jsonify
from controllers.categoriesController import categories_controller

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = categories_controller.get_all_categories()
    return jsonify(categories)

@categories_bp.route('/categories', methods=['POST'])
def create_category():
    try:
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
            
        category_id = categories_controller.create_category(data['name'])
        if category_id:
            return jsonify({'id': category_id, 'message': 'Category created successfully'}), 201
        return jsonify({'error': 'Failed to create category'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500