import google.generativeai as genai

API_KEY = "AQ.Ab8RN6IGo4fAns9TShWlGSUQ2r6HanS2NNiMglREqZCXtZVzSQ"

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

def ask_gemini(question, context):

    prompt = f"""
Context:
{context}

Question:
{question}

Answer the question using only the context provided.
"""

    response = model.generate_content(prompt)

    return response.text


def generate_document(prompt, context=None):

    if context:
        prompt_text = f"""
You are a professional document writer. Using the reference context below, generate a complete, well-structured document based on the user's request.

Reference Context:
{context}

User Request:
{prompt}

Instructions:
- Write a complete, professional document (not a Q&A answer or brief summary)
- Use clear sections with markdown headings (# for main title, ## for sections, ### for subsections)
- Include bullet points or numbered lists where appropriate
- Make the document ready for export to PDF/DOCX
- Do not include meta-commentary like "Here is your document" or "Sure, I can help"
- Output only the document content
"""
    else:
        prompt_text = f"""
You are a professional document writer. Generate a complete, well-structured document based on the user's request.

User Request:
{prompt}

Instructions:
- Write a complete, professional document
- Use clear sections with markdown headings (# for main title, ## for sections, ### for subsections)
- Include bullet points or numbered lists where appropriate
- Make the document ready for export to PDF/DOCX
- Do not include meta-commentary like "Here is your document"
- Output only the document content
"""

    response = model.generate_content(prompt_text)

    return response.text