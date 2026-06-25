import google.generativeai as genai

API_KEY = "AQ.Ab8RN6LGkxO9o015kUO_x1Zua7r9c6OCvkeWpHFiGYEJns-PPA"

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