from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from models import db, client
from config import config
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

jwt = JWTManager()
mail = Mail()


def create_app(config_name=None):
    """Application factory"""
    app = Flask(__name__)

    # Load configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app.config.from_object(config[config_name])

    # Store MongoDB connection in app context
    app.mongo_client = client
    app.mongo_db = db

    # Initialize extensions
    jwt.init_app(app)
    mail.init_app(app)
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Register blueprints
    from api.auth import auth_bp
    from api.jobs import jobs_bp
    from api.resumes import resumes_bp
    from api.matching import matching_bp
    from api.job_alerts import job_alerts_bp
    from api.notifications import notifications_bp
    from api.analytics import analytics_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(resumes_bp, url_prefix='/api/resumes')
    app.register_blueprint(matching_bp, url_prefix='/api/matching')
    app.register_blueprint(job_alerts_bp, url_prefix='/api/job-alerts')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'SkillBridge API',
            'version': '1.0.0'
        }), 200

    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Welcome to SkillBridge API',
            'version': '1.0.0',
            'documentation': '/api/docs',
            'endpoints': {
                'auth': '/api/auth',
                'jobs': '/api/jobs',
                'resumes': '/api/resumes',
                'matching': '/api/matching'
            }
        }), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Resource not found'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        logger.error(f"Unhandled exception: {error}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred'
        }), 500

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'error': 'Token has expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'error': 'Invalid token'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'error': 'Authorization token is missing'
        }), 401

    logger.info(f"SkillBridge application created with config: {config_name}")

    return app


if __name__ == '__main__':
    app = create_app()

    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Run application
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
