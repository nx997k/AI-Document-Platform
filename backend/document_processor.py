import pickle
import os
import pdfplumber
from docx import Document
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def extract_text(file_path):

    if file_path.endswith(".pdf"):

        text = ""

        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

        return text

    elif file_path.endswith(".docx"):

        doc = Document(file_path)

        text = ""

        for para in doc.paragraphs:
            text += para.text + "\n"

        return text

    elif file_path.endswith(".txt"):

        with open(file_path, "r", encoding="utf-8") as file:
            text = file.read()

        return text

    return "Unsupported file format"


def chunk_text(text, chunk_size=500):

    chunks = []

    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i + chunk_size])

    return chunks


def create_embeddings(chunks):

    embeddings = model.encode(chunks)

    return embeddings.tolist()


def create_faiss_index(embeddings):

    vectors = np.array(
        embeddings,
        dtype="float32"
    )

    dimension = vectors.shape[1]

    index = faiss.IndexFlatL2(dimension)

    index.add(vectors)

    return index


def search_chunks(question, chunks, index, k=2):

    question_embedding = model.encode(
        [question]
    )

    question_embedding = np.array(
        question_embedding,
        dtype="float32"
    )

    k = min(k, len(chunks))
    if k == 0:
        return []

    distances, indices = index.search(
        question_embedding,
        k=k
    )

    results = []

    for idx in indices[0]:
        results.append(chunks[idx])

    return results


def retrieve_context(file_path, query, k=5):
    text = extract_text(file_path)
    chunks = chunk_text(text)

    if not chunks:
        return "", []

    embeddings = create_embeddings(chunks)
    index = create_faiss_index(embeddings)
    results = search_chunks(query, chunks, index, k=k)
    context = "\n\n".join(results)

    return context, results

def save_faiss_index(index, filename):
    """
    Save FAISS index to backend/indexes
    """
    os.makedirs("indexes", exist_ok=True)

    index_path = os.path.join(
        "indexes",
        f"{filename}.index"
    )

    faiss.write_index(index, index_path)


def load_faiss_index(filename):
    """
    Load FAISS index from backend/indexes
    """
    index_path = os.path.join(
        "indexes",
        f"{filename}.index"
    )

    return faiss.read_index(index_path)


def save_chunks(chunks, filename):
    """
    Save chunk list to backend/metadata
    """
    os.makedirs("metadata", exist_ok=True)

    chunk_path = os.path.join(
        "metadata",
        f"{filename}.pkl"
    )

    with open(chunk_path, "wb") as file:
        pickle.dump(chunks, file)


def load_chunks(filename):
    """
    Load chunk list from backend/metadata
    """
    chunk_path = os.path.join(
        "metadata",
        f"{filename}.pkl"
    )

    with open(chunk_path, "rb") as file:
        return pickle.load(file)