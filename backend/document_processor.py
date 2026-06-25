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