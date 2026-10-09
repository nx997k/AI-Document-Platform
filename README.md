# AI Document Platform

A React and Flask workspace for uploading text based documents, searching them with semantic retrieval, asking document grounded questions, generating drafts with an LLM, and exporting drafts to PDF or DOCX.

## Current capabilities

- JWT registration and sign in, with private API routes and per-user file directories.
- Upload and indexing for PDF, DOCX, and TXT files (20 MB default limit). Scanned PDFs without an OCR text layer are not supported.
- Semantic retrieval using `sentence-transformers` and FAISS. The configured embedding model defaults to `all-MiniLM-L6-v2`.
- Chat and document generation with Google Gemini or a local Ollama server.
- Editable generation output and PDF/DOCX export.
- Per-user document listing, deletion, and chat history.

The application is a local development project. Deployment, production hardening, OCR, asynchronous processing, and hosted storage have not been verified or implemented.

## Architecture

```text
React + Vite  →  Flask REST API  →  SQLite (users and chat history)
                         ├── per-user uploaded files
                         ├── FAISS indexes and saved text chunks
                         └── Gemini API or Ollama
```

`backend/app.py` defines the API. `document_processor.py` extracts text, chunks it, embeds and indexes it. `rag_service.py` retrieves stored vectors for chat. Provider adapters live under `backend/llm/`. `document_exporter.py` creates PDF and DOCX downloads.

## Local setup

### Backend

Python 3.10+ is recommended. From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set a long random `JWT_SECRET_KEY`. For Gemini, set `GEMINI_API_KEY` and `LLM_PROVIDER=gemini`. For local inference, install and start Ollama, pull the model named by `OLLAMA_MODEL`, and set `LLM_PROVIDER=ollama`. The sentence-transformers model is downloaded on first use if it is not cached.

Start the API:

```powershell
python app.py
```

It listens on `http://127.0.0.1:5000`. SQLite tables are created at startup. Uploaded files and generated FAISS metadata are stored below `backend/` and are intentionally ignored by Git.

### Frontend

In another terminal from the repository root:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal (usually `http://localhost:5173`). Set `VITE_API_URL` when the API uses a different address. Update `CORS_ORIGINS` in the backend environment to match the frontend origin.

## API routes

| Method | Route | Authentication | Purpose |
|---|---|---:|---|
| POST | `/register` | No | Create an account |
| POST | `/login` | No | Return a JWT and user profile |
| GET | `/documents` | Yes | List current user's files |
| POST | `/upload` | Yes | Upload, extract and index a file |
| DELETE | `/documents/<filename>` | Yes | Delete a user's file and its index |
| GET | `/ask/<filename>?question=...` | Yes | RAG answer for an owned file |
| GET | `/chat-history` | Yes | Current user's recent chat history |
| POST | `/generate` | Yes | Generate content, optionally with an owned source file |
| POST | `/export` | Yes | Download generated content as PDF or DOCX |

The frontend stores the access token in local storage for this portfolio project. For a public production service, review the session model, rate limiting, CSRF strategy, file scanning, database migrations/backups, observability, and deployment configuration.

## Checks

```powershell
cd frontend
npm run lint
npm run build
```

Backend syntax can be checked from `backend/` with `python -m compileall app.py config.py document_exporter.py document_processor.py models.py rag_service.py llm`. Live AI requests require the selected provider to be configured and available.

## Repository hygiene

Do not commit `.env`, user databases, uploads, FAISS indexes, model caches, virtual environments, `node_modules`, or build output. Keep real screenshots in `screenshots/` only after capturing them from a running, verified application.
