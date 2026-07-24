import os
from dotenv import load_dotenv
from google import genai

# ----------------------------
# Load Environment Variables
# ----------------------------
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found. Please add it to your backend/.env file."
    )

client = genai.Client(api_key=API_KEY)

# Change model here if needed
MODEL_NAME = "gemini-2.5-flash"


# ----------------------------
# Chat with Uploaded Documents (RAG)
# ----------------------------
def ask_gemini(question, context):
    """
    Answers a user's question using only the retrieved document context.
    """

    if not context or not context.strip():
        return "I couldn't find relevant information in the uploaded documents."

    prompt = f"""
You are an intelligent AI assistant for an AI Document Platform.

Your job is to answer ONLY using the supplied document context.

Rules:
1. Never invent information.
2. Never use outside knowledge.
3. If the answer is not present in the context, say:
   "I couldn't find this information in the uploaded documents."
4. Keep answers clear and professional.

------------------------
DOCUMENT CONTEXT
------------------------
{context}

------------------------
USER QUESTION
------------------------
{question}
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )

        return response.text

    except Exception as e:
        return f"Gemini Error: {str(e)}"


# ----------------------------
# AI Document Generation
# ----------------------------
def generate_document(prompt, context=None):
    """
    Generates professional documents.
    Uses reference context when available.
    """

    if context and context.strip():

        final_prompt = f"""
You are an expert professional document writer.

Use the reference context whenever it is relevant.

Reference Context:
{context}

User Request:
{prompt}

Requirements:
- Professional formatting
- Clear headings
- Proper grammar
- Well-structured content
- Complete response
"""

    else:

        final_prompt = f"""
You are an expert professional document writer.

Generate a complete, well-formatted document.

User Request:
{prompt}
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=final_prompt
        )

        return response.text

    except Exception as e:
        return f"Gemini Error: {str(e)}"