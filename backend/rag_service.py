import os

from document_processor import (
    load_faiss_index,
    load_chunks,
    search_chunks,
)

from llm.llm_service import LLMService
from config import LLM_PROVIDER

llm = LLMService(LLM_PROVIDER)


def answer_question(file_path, question):

    document_name = os.path.splitext(
        os.path.basename(file_path)
    )[0]

    index = load_faiss_index(document_name)

    chunks = load_chunks(document_name)

    results = search_chunks(
        question,
        chunks,
        index
    )

    context = "\n".join(results)

    answer = llm.chat(
        question,
        context
    )

    return answer