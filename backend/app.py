import os
from rag_service import answer_question
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from llm.llm_service import LLMService
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

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
llm = LLMService("ollama")

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
        return jsonify({
          "message": "Login successful",
          "user": {
          "id": user.id,
          "username": user.username,
          "email": user.email
        }
    })

    return jsonify({"message": "Invalid password"}), 401

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"message": "No file selected"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400

    filename = secure_filename(file.filename)

    upload_path = os.path.join("uploads", filename)

    file.save(upload_path)

    # Process document immediately
    text = extract_text(upload_path)

    chunks = chunk_text(text)

    embeddings = create_embeddings(chunks)

    index = create_faiss_index(embeddings)

    # Remove extension from filename
    document_name = os.path.splitext(filename)[0]

    save_faiss_index(index, document_name)

    save_chunks(chunks, document_name)

    return jsonify({
        "message": "File uploaded and indexed successfully",
        "filename": filename,
        "chunks": len(chunks)
   })

@app.route("/documents", methods=["GET"])
def get_documents():
    files = os.listdir("uploads")
    return jsonify(files)

@app.route("/extract/<filename>", methods=["GET"])
def extract_document(filename):

    file_path = os.path.join("uploads", filename)

    text = extract_text(file_path)

    return jsonify({
        "filename": filename,
        "text": text
    })


@app.route("/chunks/<filename>", methods=["GET"])
def get_chunks(filename):

    file_path = os.path.join("uploads", filename)

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
def ask_document(filename):

    question = request.args.get("question")

    user_id = request.args.get("user_id")

    file_path = os.path.join("uploads", filename)

    answer = answer_question(file_path, question)

    if user_id:

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

    prompt = data.get("prompt", "").strip()
    source_document = data.get("source_document")

    if not prompt:
        return jsonify({"message": "Prompt is required"}), 400

    context = ""
    retrieved_chunks = []

    if source_document:
        file_path = os.path.join("uploads", secure_filename(source_document))

        if not os.path.exists(file_path):
            return jsonify({"message": "Source document not found"}), 404

        context, retrieved_chunks = retrieve_context(file_path, prompt, k=5)

    content = llm.generate_document(
    prompt,
    context or ""
       )

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

