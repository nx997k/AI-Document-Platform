import os

from config import LLM_PROVIDER
from document_processor import load_faiss_index, load_chunks, search_chunks
from llm.llm_service import LLMService


class NoRetrievedPassagesError(Exception):
    """Raised when a document has no passages to ground an answer in."""


def answer_question_with_sources(file_path, question, user_id, index_folder=None, metadata_folder=None):
    filename = os.path.basename(file_path)
    base_document_name = os.path.splitext(filename)[0]
    document_name = f"user_{user_id}_{base_document_name}"

    index = load_faiss_index(document_name, index_folder)
    chunks = load_chunks(document_name, metadata_folder)
    results = search_chunks(question, chunks, index)
    if not results:
        raise NoRetrievedPassagesError("No passages were retrieved from this document.")

    context = "\n".join(results)
    answer = LLMService(LLM_PROVIDER).chat(question, context)
    return answer, results


def answer_question(file_path, question, user_id, index_folder=None, metadata_folder=None):
    answer, _sources = answer_question_with_sources(
        file_path, question, user_id, index_folder, metadata_folder
    )
    return answer
