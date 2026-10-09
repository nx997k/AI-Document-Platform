import os
from config import GEMINI_MODEL
from google import genai
from llm.base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):

    def __init__(self, model=None):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables.")

        self.client = genai.Client(api_key=api_key)
        self.model = model or GEMINI_MODEL

    def chat(self, question, context=""):

        prompt = f"""
You are an AI Document Assistant.

Use ONLY the provided context to answer.

If the answer is not available in the context, reply:

"I couldn't find that information in the uploaded documents."

Context:
{context}

Question:
{question}
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        return response.text

    def generate_document(self, prompt, context=""):

        final_prompt = f"""
You are an expert technical writer.

Reference Context:

{context}

User Request:

{prompt}

Generate a professional, well-structured document.
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=final_prompt
        )

        return response.text
