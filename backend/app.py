from flask import Flask
from flask_cors import CORS
from auth_routes import auth_bp
from profile_routes import profile_bp
from ngo_routes import ngo_bp
from utilization_routes import utilization_bp
from donation_routes import donation_bp
from donor_routes import donor_bp
from ngo_analytics_routes import ngo_analytics_bp
from donor_analytics_routes import donor_analytics_bp
from admin_routes import admin_bp
from reports_routes import reports_bp
import os

app = Flask(__name__)
# Secret used for signing JWTs; override with env var in production
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-me-please')
# Allow cross-origin requests from the frontend dev server (and others) for /api/* routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(ngo_bp)
app.register_blueprint(utilization_bp)
app.register_blueprint(donation_bp)
app.register_blueprint(donor_bp)
app.register_blueprint(ngo_analytics_bp)
app.register_blueprint(donor_analytics_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(reports_bp)


if __name__ == "__main__":
    app.run(debug=True)

