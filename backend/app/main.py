from flask import Flask, jsonify
from flask_cors import CORS

from .database.db import init_db
from .routers.completion import completion_bp
from .routers.stats import stats_bp
from .routers.v2_jobs import v2_jobs_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    with app.app_context():
        init_db()

    app.register_blueprint(completion_bp, url_prefix="/v1")
    app.register_blueprint(stats_bp, url_prefix="/v1")
    app.register_blueprint(v2_jobs_bp, url_prefix="/v2")

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok", "service": "token-exchange", "version": "2.0.0"})

    return app


app = create_app()
