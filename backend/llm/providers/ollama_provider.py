import os

import ollama

from llm.base import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):

    def __init__(self, model=None):
        self.model = model or os.getenv("OLLAMA_MODEL", "qwen3:8b")

    def chat(self, question: str, context: str = "") -> str:

        prompt = f"""
You are an AI Document Assistant.

Use ONLY the provided context to answer.

If the answer is unavailable, say:

"I couldn't find that information in the uploaded documents."

Context:

{context}

Question:

{question}
"""

        print("Calling Ollama Chat...")

        response = ollama.chat(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        print("Ollama Chat Finished")

        return response["message"]["content"]

    def generate_document(self, prompt: str, context: str = "") -> str:

        print("Entered generate_document()")

        final_prompt = f"""
You are an expert technical writer.

Reference Context:

{context}

User Request:

{prompt}
"""

        print("Calling Ollama Generate...")

        response = ollama.chat(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": final_prompt
                }
            ]
        )

        print("Ollama Generate Finished")

        return response["message"]["content"]
