import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def ask_gemini(question, context):

    prompt = f"""
Context:
{context}

Question:
{question}

Answer only using the provided context.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text


def generate_document(prompt, context=None):

    if context:
        final_prompt = f"""
You are a professional document writer.

Reference Context:
{context}

User Request:
{prompt}

Generate a professional document.
"""
    else:
        final_prompt = prompt

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=final_prompt
    )

    return response.text