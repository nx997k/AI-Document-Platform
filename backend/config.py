import os

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")