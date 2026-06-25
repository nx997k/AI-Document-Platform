# 🤖 AI Document Generation Platform

An AI-powered full-stack document intelligence platform built with **React**, **Flask**, **Google Gemini AI**, and **Retrieval-Augmented Generation (RAG)**. The application enables users to upload documents, chat with them using AI, generate complete documents from prompts, and export results as PDF or DOCX.

---

# 🚀 Overview

The AI Document Generation Platform combines modern web technologies with Large Language Models (LLMs) to create an intelligent document assistant. Instead of relying solely on AI, the platform implements **Retrieval-Augmented Generation (RAG)**, retrieving relevant information from uploaded documents before generating responses. This approach improves accuracy, reduces hallucinations, and produces context-aware content.

Users can upload reference documents, interact with them through an AI chatbot, generate reports, meeting minutes, project documentation, and other professional documents, edit the generated content, and export it in multiple formats.

---

# ✨ Key Features

### 🔐 Authentication

* Secure user registration and login
* Session management

### 📂 Document Management

* Upload PDF, DOCX, and TXT files
* Manage uploaded documents
* Document dashboard

### 🤖 AI Chat

* Context-aware document chat
* Gemini-powered responses
* RAG-based retrieval
* Displays retrieved context chunks

### 📝 AI Document Generator

* Generate complete documents from natural language prompts
* Optional reference document for RAG
* Editable generated content
* Live word count
* Quick prompt suggestions
* Visual generation workflow

### 📄 Export Support

* Export generated documents as PDF
* Export generated documents as DOCX
* Markdown heading support
* Download generated files instantly

---

# 🧠 AI Workflow

```text
Prompt
   │
   ▼
Retrieve Relevant Document Chunks (FAISS)
   │
   ▼
Google Gemini AI
   │
   ▼
Generated Document
   │
   ▼
User Editing
   │
   ▼
Export as PDF / DOCX
```

---

# 🛠 Technology Stack

## Frontend

* React.js
* Vite
* React Router
* Tailwind CSS
* JavaScript

## Backend

* Python
* Flask
* Flask-CORS
* SQLAlchemy
* SQLite

## AI & Machine Learning

* Google Gemini API
* Retrieval-Augmented Generation (RAG)
* FAISS Vector Search
* Document Chunking

## Document Processing

* ReportLab (PDF Export)
* python-docx (DOCX Export)

---

# 📁 Project Structure

```text
AI-Document-Platform/
│
├── backend/
│   ├── app.py
│   ├── gemini_service.py
│   ├── document_processor.py
│   ├── document_exporter.py
│   ├── models.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── public/
│
├── README.md
└── .gitignore
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/nx997k/AI-Document-Platform.git
```

## Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 💻 How to Use

1. Register or log in.
2. Upload one or more documents.
3. Open **AI Chat** to ask questions about uploaded documents.
4. Open **Generator** from the sidebar.
5. Enter a prompt (e.g., "Create a project report based on the uploaded document").
6. Optionally select a reference document for RAG.
7. Generate the document.
8. Edit the generated content.
9. Export it as **PDF** or **DOCX**.

---

# 📌 REST API

### POST `/generate`

Generates a complete AI document using an optional reference document.

### POST `/export`

Exports generated content to:

* PDF
* DOCX

---

# 📸 Screenshots

Add screenshots for:

* Login Page
* Dashboard
* Upload Document
* AI Chat
* AI Document Generator
* Generated Document
* Export Feature

---

# 🔮 Future Enhancements

* Cloud storage integration
* OCR support for scanned PDFs
* Multi-language document generation
* Team collaboration
* Advanced document analytics
* Semantic search improvements
* User roles and permissions

---

# 👨‍💻 Author

**Nikhil Mettu**

GitHub: https://github.com/nx997k

---

# ⭐ Highlights

* Full-Stack React + Flask Application
* Google Gemini AI Integration
* Retrieval-Augmented Generation (RAG)
* FAISS Vector Search
* AI Document Generation
* AI Chat Assistant
* PDF & DOCX Export
* Modern Responsive UI
* REST API Architecture
* Production-Ready Modular Design
