from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from db import db
from routes.tasks import tasks_bp
from routes.categories import categories_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(tasks_bp)
app.register_blueprint(categories_bp)

@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('../frontend', filename)

if __name__ == '__main__':
    db.init_database()
    app.run(debug=True, port=5000)