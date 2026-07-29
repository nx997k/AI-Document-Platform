import os

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")