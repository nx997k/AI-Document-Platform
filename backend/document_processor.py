import os
import pickle

import faiss
import numpy as np
import pdfplumber
from docx import Document

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"))
    return _model


def extract_text(file_path):
    extension = os.path.splitext(file_path)[1].lower()
    if extension == ".pdf":
        with pdfplumber.open(file_path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages).strip()
    if extension == ".docx":
        doc = Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs).strip()
    if extension == ".txt":
        with open(file_path, "r", encoding="utf-8-sig") as file:
            return file.read().strip()
    raise ValueError("Unsupported file format")


def chunk_text(text, chunk_size=900, overlap=120):
    text = (text or "").strip()
    if not text:
        return []
    step = max(1, chunk_size - overlap)
    return [text[i:i + chunk_size] for i in range(0, len(text), step)]


def create_embeddings(chunks):
    if not chunks:
        return []
    return _get_model().encode(chunks, convert_to_numpy=True, normalize_embeddings=True).astype("float32")


def create_faiss_index(embeddings):
    vectors = np.asarray(embeddings, dtype="float32")
    if vectors.ndim != 2 or vectors.shape[0] == 0:
        raise ValueError("At least one text embedding is required")
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)
    return index


def search_chunks(question, chunks, index, k=2):
    if not chunks:
        return []
    vector = _get_model().encode([question], convert_to_numpy=True, normalize_embeddings=True).astype("float32")
    _scores, indices = index.search(vector, min(k, len(chunks)))
    return [chunks[i] for i in indices[0] if 0 <= i < len(chunks)]


def retrieve_context(file_path, query, k=5):
    chunks = chunk_text(extract_text(file_path))
    if not chunks:
        return "", []
    results = search_chunks(query, chunks, create_faiss_index(create_embeddings(chunks)), k)
    return "\n\n".join(results), results


def _artifact_path(folder, filename, suffix):
    safe_name = os.path.basename(filename)
    if safe_name != filename or not safe_name:
        raise ValueError("Invalid artifact identifier")
    return os.path.join(folder or os.path.join(_BASE_DIR, "indexes"), safe_name + suffix)


def save_faiss_index(index, filename, folder=None):
    folder = folder or os.path.join(_BASE_DIR, "indexes")
    os.makedirs(folder, exist_ok=True)
    faiss.write_index(index, _artifact_path(folder, filename, ".index"))


def load_faiss_index(filename, folder=None):
    folder = folder or os.path.join(_BASE_DIR, "indexes")
    return faiss.read_index(_artifact_path(folder, filename, ".index"))


def save_chunks(chunks, filename, folder=None):
    folder = folder or os.path.join(_BASE_DIR, "metadata")
    os.makedirs(folder, exist_ok=True)
    with open(_artifact_path(folder, filename, ".pkl"), "wb") as file:
        pickle.dump(chunks, file)


def load_chunks(filename, folder=None):
    folder = folder or os.path.join(_BASE_DIR, "metadata")
    with open(_artifact_path(folder, filename, ".pkl"), "rb") as file:
        return pickle.load(file)
