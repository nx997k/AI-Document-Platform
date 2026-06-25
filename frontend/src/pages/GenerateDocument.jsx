import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";

const API = "http://127.0.0.1:5000";

const PROMPT_SUGGESTIONS = [
  "Create a project report based on the uploaded document.",
  "Generate meeting minutes from the source material.",
  "Write a business proposal using the reference context.",
  "Draft an executive summary of the document.",
  "Create a technical documentation summary.",
];

const FLOW_STEPS = [
  { id: 1, label: "Prompt", icon: "✎" },
  { id: 2, label: "Retrieve", icon: "🔍" },
  { id: 3, label: "Generate", icon: "🤖" },
  { id: 4, label: "Edit", icon: "✏" },
  { id: 5, label: "Export", icon: "⬇" },
];

function GenerateDocument() {
  const [prompt, setPrompt] = useState("");
  const [documents, setDocuments] = useState([]);
  const [sourceDocument, setSourceDocument] = useState("");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Generated Document");
  const [retrievedChunks, setRetrievedChunks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const response = await fetch(`${API}/documents`);
    const data = await response.json();
    setDocuments(data);
    if (data.length > 0) {
      setSourceDocument(data[0]);
    }
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setActiveStep(2);

    try {
      const response = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          source_document: sourceDocument || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Generation failed");
        setActiveStep(1);
        return;
      }

      setRetrievedChunks(data.retrieved_chunks || []);
      setActiveStep(3);

      setTimeout(() => {
        setContent(data.content || "");
        setActiveStep(4);
      }, 400);
    } catch {
      alert("Failed to connect to the server");
      setActiveStep(1);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format) => {
    if (!content.trim()) {
      alert("Nothing to export. Generate a document first.");
      return;
    }

    setExporting(format);

    try {
      const response = await fetch(`${API}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          format,
          title,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "Export failed");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, "_")}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      setActiveStep(5);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;

  return (
    <AppLayout
      title="AI Document Generator"
      subtitle="Generate complete documents from prompts with RAG-powered context retrieval"
    >
      <div className="flow-steps">
        {FLOW_STEPS.map((step) => (
          <div
            key={step.id}
            className={`flow-step${activeStep >= step.id ? " flow-step--active" : ""}${activeStep === step.id ? " flow-step--current" : ""}`}
          >
            <span className="flow-step-icon">{step.icon}</span>
            <span className="flow-step-label">{step.label}</span>
            {step.id < FLOW_STEPS.length && (
              <span className="flow-step-arrow">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="generator-grid">
        <div className="glass-card generator-panel">
          <h2 className="section-title">1. Document Request</h2>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label" htmlFor="prompt">
                What document do you want to create?
              </label>
              <textarea
                id="prompt"
                className="form-input form-textarea"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "Create a project report." or "Generate meeting minutes."'
                required
              />
            </div>

            <div className="prompt-suggestions">
              {PROMPT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="prompt-chip"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="source-doc">
                Reference Document (optional — enables RAG retrieval)
              </label>
              <select
                id="source-doc"
                className="form-select"
                value={sourceDocument}
                onChange={(e) => setSourceDocument(e.target.value)}
              >
                <option value="">No reference — generate from prompt only</option>
                {documents.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="btn--full"
              loading={generating}
              disabled={!prompt.trim()}
              icon="✦"
            >
              Generate Document
            </Button>
          </form>

          {retrievedChunks.length > 0 && (
            <div className="retrieved-context mt-4">
              <h3 className="section-title">
                Retrieved Context ({retrievedChunks.length} chunks)
              </h3>
              {retrievedChunks.map((chunk, i) => (
                <div key={i} className="context-chunk">
                  {chunk.slice(0, 200)}
                  {chunk.length > 200 ? "…" : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card generator-panel">
          <div className="editor-header">
            <h2 className="section-title">2. Edit & Export</h2>
            {content && (
              <span className="word-count">{wordCount} words</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="doc-title">
              Document Title
            </label>
            <input
              id="doc-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Generated Document"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="doc-content">
              Document Content
            </label>
            <textarea
              id="doc-content"
              className="form-input form-textarea form-textarea--editor"
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your generated document will appear here. You can edit it before exporting."
            />
          </div>

          <div className="action-row" style={{ justifyContent: "flex-start" }}>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleExport("pdf")}
              loading={exporting === "pdf"}
              disabled={!content.trim() || !!exporting}
              icon="📄"
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleExport("docx")}
              loading={exporting === "docx"}
              disabled={!content.trim() || !!exporting}
              icon="📝"
            >
              Export DOCX
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setContent("");
                setRetrievedChunks([]);
                setActiveStep(1);
              }}
              disabled={!content && retrievedChunks.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default GenerateDocument;
