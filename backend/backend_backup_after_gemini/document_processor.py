import pdfplumber
from docx import Document
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

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

    return "Unsupported file format"

def chunk_text(text, chunk_size=500):

    chunks = []

    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i + chunk_size])

    return chunks

def create_embeddings(chunks):

    model = SentenceTransformer(
        "all-MiniLM-L6-v2"
    )

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