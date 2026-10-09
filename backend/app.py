import os
import re
import tempfile
from datetime import timedelta

import bcrypt
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity, jwt_required,
)
from werkzeug.utils import secure_filename

from config import LLM_PROVIDER
from document_exporter import export_to_docx, export_to_pdf
from document_processor import (
    chunk_text, create_embeddings, create_faiss_index, extract_text,
    save_faiss_index, save_chunks,
)
from llm.llm_service import LLMService
from models import ChatHistory, User, db
from rag_service import NoRetrievedPassagesError, answer_question_with_sources

load_dotenv()
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 20 * 1024 * 1024))


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(
        SQLALCHEMY_DATABASE_URI=os.getenv(
            "DATABASE_URL", "sqlite:///database.db"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY"),
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=1),
        MAX_CONTENT_LENGTH=MAX_UPLOAD_BYTES,
        UPLOAD_FOLDER=os.path.join(app.root_path, "uploads"),
        INDEX_FOLDER=os.path.join(app.root_path, "indexes"),
        METADATA_FOLDER=os.path.join(app.root_path, "metadata"),
    )
    if test_config:
        app.config.update(test_config)
    if not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError("Set JWT_SECRET_KEY in the backend environment.")
    development_origins = ",".join((
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ))
    cors_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", development_origins).split(",")
        if origin.strip()
    ]
    CORS(
        app,
        origins=cors_origins,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )
    db.init_app(app)
    JWTManager(app)

    def error(message, status):
        return jsonify(message=message), status

    def provider_error_message(provider, exc):
        provider = (provider or "").lower()
        code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
        try:
            code = int(code)
        except (TypeError, ValueError):
            code = None

        if provider == "gemini":
            if code == 429:
                return "Gemini rate limit reached. Wait briefly, then retry."
            if code == 503:
                return "Gemini is temporarily at capacity. Wait briefly, then retry."
            if code in {401, 403}:
                return "Gemini rejected the API key or project permissions. Check the backend configuration."
            if code == 404:
                return "Gemini could not find the configured model. Check GEMINI_MODEL in the backend environment."
            return f"Gemini request failed ({type(exc).__name__}). See the backend log for details."

        if provider == "ollama":
            if code == 404:
                return "Ollama could not find the selected model. Pull that model and retry."
            if isinstance(exc, ConnectionError) or type(exc).__name__ in {"ConnectError", "ConnectionError"}:
                return "Could not connect to Ollama. Start its local service and retry."
            return f"Ollama request failed ({type(exc).__name__}). See the backend log for details."

        return f"The {provider or 'AI provider'} request failed ({type(exc).__name__}). See the backend log for details."

    def user_directory(user_id):
        path = os.path.join(app.config["UPLOAD_FOLDER"], str(user_id))
        os.makedirs(path, exist_ok=True)
        return path

    def owned_file(filename, user_id):
        if not isinstance(filename, str):
            return None
        safe_name = secure_filename(filename or "")
        if not safe_name or safe_name != filename:
            return None
        path = os.path.abspath(os.path.join(user_directory(user_id), safe_name))
        if os.path.commonpath([path, os.path.abspath(user_directory(user_id))]) != os.path.abspath(user_directory(user_id)):
            return None
        return path if os.path.isfile(path) else None

    @app.get("/")
    def home():
        return jsonify(message="Backend is working")

    @app.post("/register")
    def register():
        data = request.get_json(silent=True) or {}
        username = str(data.get("username", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")
        if not username or len(username) > 100 or len(email) > 120 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) or not isinstance(password, str) or not 8 <= len(password.encode("utf-8")) <= 72:
            return error("Enter a username, valid email, and password between 8 and 72 characters.", 400)
        if User.query.filter((User.email == email) | (User.username == username)).first():
            return error("An account with that email or username already exists.", 409)
        user = User(username=username, email=email, password=bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode())
        db.session.add(user)
        db.session.commit()
        return jsonify(message="Account created successfully."), 201

    @app.post("/login")
    def login():
        data = request.get_json(silent=True) or {}
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")
        user = User.query.filter_by(email=email).first()
        if not user or not isinstance(password, str) or len(password.encode("utf-8")) > 72 or not bcrypt.checkpw(password.encode(), user.password.encode()):
            return error("Email or password is incorrect.", 401)
        token = create_access_token(identity=str(user.id))
        return jsonify(message="Login successful", access_token=token, user={"id": user.id, "username": user.username, "email": user.email})

    @app.post("/upload")
    @jwt_required()
    def upload_file():
        file = request.files.get("file")
        if not file or not file.filename:
            return error("Choose a file to upload.", 400)
        filename = secure_filename(file.filename)
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if not filename or extension not in ALLOWED_EXTENSIONS:
            return error("Supported file types are PDF, DOCX, and TXT.", 400)
        folder = user_directory(get_jwt_identity())
        path = os.path.join(folder, filename)
        doc_key = f"user_{get_jwt_identity()}_{os.path.splitext(filename)[0]}"
        index_name = secure_filename(doc_key) + ".index"
        metadata_name = secure_filename(doc_key) + ".pkl"
        try:
            os.makedirs(app.config["INDEX_FOLDER"], exist_ok=True)
            os.makedirs(app.config["METADATA_FOLDER"], exist_ok=True)
            # Stage the replacement and its search artifacts first. A failed
            # retry with the same name must not delete the user's prior file.
            with tempfile.TemporaryDirectory(prefix="documind-upload-", dir=app.root_path) as staging:
                staged_upload = os.path.join(staging, filename)
                file.save(staged_upload)
                text = extract_text(staged_upload)
                chunks = chunk_text(text)
                if not chunks:
                    return error("No readable text was found in this file.", 422)
                index = create_faiss_index(create_embeddings(chunks))
                staged_index_folder = os.path.join(staging, "indexes")
                staged_metadata_folder = os.path.join(staging, "metadata")
                save_faiss_index(index, doc_key, staged_index_folder)
                save_chunks(chunks, doc_key, staged_metadata_folder)

                replacements = (
                    (staged_upload, path),
                    (os.path.join(staged_index_folder, index_name), os.path.join(app.config["INDEX_FOLDER"], index_name)),
                    (os.path.join(staged_metadata_folder, metadata_name), os.path.join(app.config["METADATA_FOLDER"], metadata_name)),
                )
                backups = []
                installed = []
                try:
                    for position, (_staged, target) in enumerate(replacements):
                        if os.path.exists(target):
                            backup = os.path.join(staging, f"backup-{position}")
                            os.replace(target, backup)
                            backups.append((backup, target))
                    for staged, target in replacements:
                        os.replace(staged, target)
                        installed.append(target)
                except Exception:
                    for target in installed:
                        if os.path.exists(target):
                            os.remove(target)
                    for backup, target in backups:
                        if os.path.exists(backup):
                            os.replace(backup, target)
                    raise
        except Exception as exc:
            app.logger.exception("Document processing failed")
            if "Application Control policy has blocked this file" in str(exc):
                return error("Document indexing is blocked by Windows Application Control while loading the embedding runtime. Ask your administrator to review the blocked SciPy extension.", 503)
            return error("The file could not be processed. Check that it is a valid, text-readable document.", 422)
        return jsonify(message="Document uploaded and indexed.", filename=filename, chunks=len(chunks)), 201

    @app.get("/documents")
    @jwt_required()
    def get_documents():
        folder = user_directory(get_jwt_identity())
        documents = []
        for filename in sorted(os.listdir(folder), key=str.casefold):
            path = os.path.join(folder, filename)
            if os.path.isfile(path):
                stat = os.stat(path)
                doc_key = f"user_{get_jwt_identity()}_{os.path.splitext(filename)[0]}"
                index_path = os.path.join(app.config["INDEX_FOLDER"], secure_filename(doc_key) + ".index")
                metadata_path = os.path.join(app.config["METADATA_FOLDER"], secure_filename(doc_key) + ".pkl")
                documents.append({
                    "name": filename,
                    "size": stat.st_size,
                    "uploaded_at": stat.st_mtime,
                    "indexed": os.path.isfile(index_path) and os.path.isfile(metadata_path),
                })
        return jsonify(documents)

    @app.delete("/documents/<path:filename>")
    @jwt_required()
    def delete_document(filename):
        path = owned_file(filename, get_jwt_identity())
        if not path:
            return error("Document not found.", 404)
        os.remove(path)
        key = f"user_{get_jwt_identity()}_{os.path.splitext(filename)[0]}"
        for folder, suffix in ((app.config["INDEX_FOLDER"], ".index"), (app.config["METADATA_FOLDER"], ".pkl")):
            artifact = os.path.join(folder, secure_filename(key) + suffix)
            if os.path.isfile(artifact):
                os.remove(artifact)
        return jsonify(message="Document deleted.")

    @app.get("/chunks/<path:filename>")
    @jwt_required()
    def get_chunks(filename):
        path = owned_file(filename, get_jwt_identity())
        if not path:
            return error("Document not found.", 404)
        chunks = chunk_text(extract_text(path))
        return jsonify(filename=filename, total_chunks=len(chunks), chunks=chunks)

    @app.get("/ask/<path:filename>")
    @jwt_required()
    def ask_document(filename):
        question = request.args.get("question", "").strip()
        if not question:
            return error("Question is required.", 400)
        user_id = get_jwt_identity()
        path = owned_file(filename, user_id)
        if not path:
            return error("Document not found.", 404)
        try:
            answer, sources = answer_question_with_sources(
                path, question, user_id, app.config["INDEX_FOLDER"], app.config["METADATA_FOLDER"]
            )
        except FileNotFoundError:
            return error("This document has no saved index. Upload it again to enable AI chat.", 409)
        except NoRetrievedPassagesError:
            return error("No passages were retrieved from this document, so no answer was generated.", 409)
        except Exception as exc:
            app.logger.exception("Question answering failed")
            if "Application Control policy has blocked this file" in str(exc):
                return error("Document search is blocked by Windows Application Control while loading the embedding runtime. Ask your administrator to review the blocked SciPy extension.", 503)
            return error(provider_error_message(LLM_PROVIDER, exc), 503)
        db.session.add(ChatHistory(user_id=int(user_id), document_name=filename, question=question, answer=answer))
        db.session.commit()
        return jsonify(question=question, answer=answer, sources=sources)

    @app.get("/chat-history")
    @jwt_required()
    def get_chat_history():
        chats = ChatHistory.query.filter_by(user_id=int(get_jwt_identity())).order_by(ChatHistory.created_at.desc()).limit(100).all()
        return jsonify([{"id": c.id, "document_name": c.document_name, "question": c.question, "answer": c.answer, "created_at": c.created_at.isoformat()} for c in chats])

    @app.post("/generate")
    @jwt_required()
    def generate_document_route():
        data = request.get_json(silent=True) or {}
        prompt = str(data.get("prompt", "")).strip()
        provider = str(data.get("provider", LLM_PROVIDER)).lower()
        source = data.get("source_document")
        if not prompt:
            return error("Prompt is required.", 400)
        context, chunks = "", []
        if source:
            path = owned_file(source, get_jwt_identity())
            if not path:
                return error("Reference document not found.", 404)
            try:
                text = extract_text(path)
                document_chunks = chunk_text(text)
                if not document_chunks:
                    return error("The selected reference document contains no readable text.", 422)
                from document_processor import create_embeddings, create_faiss_index, search_chunks
                index = create_faiss_index(create_embeddings(document_chunks))
                chunks = search_chunks(prompt, document_chunks, index, k=5)
                if not chunks:
                    return error("No passages were retrieved from the reference document, so a source-based draft was not generated.", 409)
                context = "\n\n".join(chunks)
            except Exception as exc:
                app.logger.exception("Reference document retrieval failed")
                if "Application Control policy has blocked this file" in str(exc):
                    return error("Reference retrieval is blocked by Windows Application Control while loading the embedding runtime. Ask your administrator to review the blocked SciPy extension.", 503)
                return error("Could not retrieve text from the reference document.", 422)
        try:
            content = LLMService(provider).generate_document(prompt, context)
        except ValueError as exc:
            return error(str(exc), 400)
        except Exception as exc:
            app.logger.exception("Document generation failed")
            return error(provider_error_message(provider, exc), 503)
        return jsonify(prompt=prompt, source_document=source, content=content, retrieved_chunks=chunks, chunks_used=len(chunks))

    @app.post("/export")
    @jwt_required()
    def export_document_route():
        data = request.get_json(silent=True) or {}
        content = str(data.get("content", "")).strip()
        fmt = str(data.get("format", "pdf")).lower()
        title = str(data.get("title", "Generated Document")).strip() or "Generated Document"
        if not content:
            return error("Document content is required.", 400)
        if fmt not in {"pdf", "docx"}:
            return error("Format must be pdf or docx.", 400)
        safe_title = secure_filename(title.replace(" ", "_")) or "generated_document"
        buffer = export_to_pdf(content, title) if fmt == "pdf" else export_to_docx(content, title)
        mimetype = "application/pdf" if fmt == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        return send_file(buffer, mimetype=mimetype, as_attachment=True, download_name=f"{safe_title}.{fmt}")

    @app.errorhandler(413)
    def too_large(_error):
        return error(f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB upload limit.", 413)

    with app.app_context():
        db.create_all()
    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
