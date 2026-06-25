import os
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify
from flask_cors import CORS
from document_processor import (
    extract_text,
    chunk_text,
    create_embeddings,
    create_faiss_index
)
from models import db, User
import bcrypt

app = Flask(__name__)
CORS(app)

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
        return jsonify({"message": "Login successful"})

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

    return jsonify({
        "message": "File uploaded successfully",
        "filename": filename
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

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)