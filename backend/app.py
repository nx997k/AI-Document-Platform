import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()
from rag_service import answer_question
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from llm.llm_service import LLMService
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from config import LLM_PROVIDER

llm = LLMService(LLM_PROVIDER)
from document_processor import (
    extract_text,
    chunk_text,
    create_embeddings,
    create_faiss_index,
    search_chunks,
    retrieve_context,
    save_faiss_index,
    load_faiss_index,
    save_chunks,
    load_chunks,
)
from document_exporter import export_to_pdf, export_to_docx
from models import db, User, ChatHistory
import bcrypt

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = "your_super_secret_key_change_this"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

jwt = JWTManager(app)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

@app.route("/")
def home():
    return {"message": "Backend is working"}

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data["username"]
    email = data["email"]
    password = data["password"]

    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    user = User(
        username=username,
        email=email,
        password=hashed_password.decode("utf-8")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully"
    })
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data["email"]
    password = data["password"]

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if bcrypt.checkpw(
        password.encode("utf-8"),
        user.password.encode("utf-8")
    ):
        access_token = create_access_token(
            identity=str(user.id)
        )

        return jsonify({
          "message": "Login successful",
          "access_token": access_token,
          "user": {
          "id": user.id,
          "username": user.username,
          "email": user.email
        }
    })

    return jsonify({"message": "Invalid password"}), 401

@app.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():

    if "file" not in request.files:
        return jsonify({"message": "No file selected"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400

    # Get logged-in user ID from JWT
    user_id = get_jwt_identity()

    filename = secure_filename(file.filename)

    # Create user-specific upload directory
    user_upload_dir = os.path.join(
        "uploads",
        str(user_id)
    )

    os.makedirs(user_upload_dir, exist_ok=True)

    # Save file inside user's directory
    upload_path = os.path.join(
        user_upload_dir,
        filename
    )

    file.save(upload_path)

    # Process document immediately
    text = extract_text(upload_path)

    chunks = chunk_text(text)

    embeddings = create_embeddings(chunks)

    index = create_faiss_index(embeddings)

    # Create user-specific FAISS/chunk identifier
    base_document_name = os.path.splitext(filename)[0]

    document_name = f"user_{user_id}_{base_document_name}"

    save_faiss_index(index, document_name)

    save_chunks(chunks, document_name)

    return jsonify({
        "message": "File uploaded and indexed successfully",
        "filename": filename,
        "chunks": len(chunks)
    })

@app.route("/documents", methods=["GET"])
@jwt_required()
def get_documents():

    user_id = get_jwt_identity()

    user_upload_dir = os.path.join(
        "uploads",
        str(user_id)
    )

    if not os.path.exists(user_upload_dir):
        return jsonify([])

    files = os.listdir(user_upload_dir)

    return jsonify(files)

@app.route("/extract/<filename>", methods=["GET"])
def extract_document(filename):

    user_id = get_jwt_identity()

    text = extract_text(file_path)

    return jsonify({
        "filename": filename,
        "text": text
    })


@app.route("/chunks/<filename>", methods=["GET"])
@jwt_required()
def get_chunks(filename):

    user_id = get_jwt_identity()

    filename = secure_filename(filename)

    user_upload_dir = os.path.join(
        "uploads",
        str(user_id)
    )

    file_path = os.path.join(
        user_upload_dir,
        filename
    )

    if not os.path.exists(file_path):
        return jsonify({"message": "Document not found"}), 404

    text = extract_text(file_path)

    chunks = chunk_text(text)

    return jsonify({
        "filename": filename,
        "total_chunks": len(chunks),
        "chunks": chunks
    })

@app.route("/embeddings/<filename>", methods=["GET"])
def get_embeddings(filename):

    file_path = os.path.join("uploads", filename)

    text = extract_text(file_path)

    chunks = chunk_text(text)

    embeddings = create_embeddings(chunks)

    return jsonify({
        "filename": filename,
        "total_chunks": len(chunks),
        "embedding_dimension": len(embeddings[0]),
        "sample_embedding": embeddings[0][:10]
    })

@app.route("/faiss/<filename>", methods=["GET"])
def test_faiss(filename):

    file_path = os.path.join("uploads", filename)

    text = extract_text(file_path)

    chunks = chunk_text(text)

    embeddings = create_embeddings(chunks)

    index = create_faiss_index(embeddings)

    return jsonify({
        "filename": filename,
        "total_chunks": len(chunks),
        "vectors_in_index": index.ntotal
    })   

@app.route("/search/<filename>", methods=["GET"])
def search_document(filename):

    question = request.args.get("question")

    file_path = os.path.join("uploads", filename)

    text = extract_text(file_path)

    chunks = chunk_text(text)

    embeddings = create_embeddings(chunks)

    index = create_faiss_index(embeddings)

    results = search_chunks(
        question,
        chunks,
        index
    )

    return jsonify({
        "question": question,
        "results": results
    })

@app.route("/ask/<filename>", methods=["GET"])
@jwt_required()
def ask_document(filename):

    question = request.args.get("question")

    if not question:
        return jsonify({"message": "Question is required"}), 400

    user_id = get_jwt_identity()

    filename = secure_filename(filename)

    user_upload_dir = os.path.join(
        "uploads",
        str(user_id)
    )

    file_path = os.path.join(
        user_upload_dir,
        filename
    )

    if not os.path.exists(file_path):
        return jsonify({"message": "Document not found"}), 404

    answer = answer_question(
        file_path,
        question,
        user_id
    )

    chat = ChatHistory(
        user_id=int(user_id),
        document_name=filename,
        question=question,
        answer=answer
    )

    db.session.add(chat)
    db.session.commit()

    return jsonify({
        "question": question,
        "answer": answer
    })

@app.route("/chat-history/<int:user_id>", methods=["GET"])
def get_chat_history(user_id):

    chats = (
        ChatHistory.query
        .filter_by(user_id=user_id)
        .order_by(ChatHistory.created_at.desc())
        .all()
    )

    history = []

    for chat in chats:
        history.append({
            "id": chat.id,
            "document_name": chat.document_name,
            "question": chat.question,
            "answer": chat.answer,
            "created_at": chat.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return jsonify(history)


@app.route("/generate", methods=["POST"])
def generate_document_route():
    data = request.get_json() or {}
    print("Received request")

    prompt = data.get("prompt", "").strip()
    source_document = data.get("source_document")
    provider = data.get("provider", LLM_PROVIDER)
    print("Provider:", provider)

    if not prompt:
        return jsonify({"message": "Prompt is required"}), 400

    context = ""
    retrieved_chunks = []

    if source_document:
        file_path = os.path.join("uploads", secure_filename(source_document))

        if not os.path.exists(file_path):
            return jsonify({"message": "Source document not found"}), 404

        context, retrieved_chunks = retrieve_context(file_path, prompt, k=5)

    llm = LLMService(provider)
    print("LLMService created")

    print("Calling generate_document...")

    content = llm.generate_document(
      prompt,
      context or ""
    )

    print("generate_document finished")

    return jsonify({
        "prompt": prompt,
        "source_document": source_document,
        "content": content,
        "retrieved_chunks": retrieved_chunks,
        "chunks_used": len(retrieved_chunks),
    })


@app.route("/export", methods=["POST"])
def export_document_route():
    data = request.get_json() or {}

    content = data.get("content", "").strip()
    export_format = data.get("format", "pdf").lower()
    title = data.get("title", "Generated Document").strip() or "Generated Document"

    if not content:
        return jsonify({"message": "Document content is required"}), 400

    if export_format not in ("pdf", "docx"):
        return jsonify({"message": "Format must be pdf or docx"}), 400

    safe_title = secure_filename(title.replace(" ", "_")) or "generated_document"

    if export_format == "pdf":
        buffer = export_to_pdf(content, title)
        mimetype = "application/pdf"
        download_name = f"{safe_title}.pdf"
    else:
        buffer = export_to_docx(content, title)
        mimetype = (
            "application/vnd.openxmlformats-officedocument"
            ".wordprocessingml.document"
        )
        download_name = f"{safe_title}.docx"

    return send_file(
        buffer,
        mimetype=mimetype,
        as_attachment=True,
        download_name=download_name,
    )

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)

