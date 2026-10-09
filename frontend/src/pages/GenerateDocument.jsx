import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { api } from "../lib/api";

const suggestions = ["Write a concise executive summary", "Draft a project status report", "Turn these notes into meeting minutes"];

function GenerateDocument() {
  const [prompt, setPrompt] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentsError, setDocumentsError] = useState("");
  const [sourceDocument, setSourceDocument] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Generated Document");
  const [retrievedChunks, setRetrievedChunks] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedSource = documents.find((document) => document.name === sourceDocument);

  useEffect(() => {
    let active = true;
    api.documents().then((items) => { if (active) setDocuments(items); })
      .catch((err) => { if (active) setDocumentsError(err.message); });
    return () => { active = false; };
  }, []);

  const generate = async (event) => {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    setError("");
    setNotice("");
    setBusy("generate");
    try {
      const data = await api.generate({ prompt: prompt.trim(), source_document: sourceDocument || null, provider });
      if (!data.content?.trim()) throw new Error("The provider returned an empty draft. Please try again.");
      setContent(data.content);
      setRetrievedChunks(Array.isArray(data.retrieved_chunks) ? data.retrieved_chunks : []);
      setNotice(data.chunks_used > 0 ? `Draft generated with ${data.chunks_used} retrieved source passage${data.chunks_used === 1 ? "" : "s"}.` : "Draft generated without document context.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const exportFile = async (format) => {
    if (!content.trim() || busy) return;
    setError("");
    setNotice("");
    setBusy(format);
    try {
      const blob = await api.exportDocument({ content, format, title });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeTitle = title.trim().replace(/[^\w-]+/g, "_") || "Generated_Document";
      anchor.href = url;
      anchor.download = `${safeTitle}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`${format.toUpperCase()} export started.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setNotice("Draft copied to clipboard.");
      setError("");
    } catch {
      setError("Clipboard access is unavailable in this browser. Select and copy the draft manually.");
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <AppLayout title="Document studio" subtitle="Turn a clear brief into a polished first draft.">
      {error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{error}</span></div>}
      {documentsError && <div className="alert alert--warning" role="status"><Icon name="warning" /><span>Your document list could not be loaded: {documentsError}. You can still generate without a source.</span></div>}
      {notice && <div className="alert alert--success" role="status"><Icon name="check" /><span>{notice}</span></div>}

      <div className="generator-layout">
        <section className="generator-brief-card">
          <div className="generator-card-heading"><span className="section-kicker">START WITH A BRIEF</span><h2>What are we writing?</h2><p>Be specific about the audience, purpose, and details to include.</p></div>
          <form onSubmit={generate}>
            <div className="form-group"><label className="form-label" htmlFor="generation-prompt">Your instructions</label><textarea id="generation-prompt" className="form-input prompt-input" rows={7} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="For example: Create a one-page project update for leadership covering progress, risks, and next steps…" required /></div>
            <div className="prompt-suggestions" aria-label="Prompt suggestions">{suggestions.map((item) => <button key={item} className="prompt-chip" type="button" onClick={() => setPrompt(item)}>{item}</button>)}</div>
            <div className="form-group"><label className="form-label" htmlFor="provider">AI provider</label><select id="provider" className="form-select" value={provider} onChange={(event) => setProvider(event.target.value)}><option value="gemini">Google Gemini</option><option value="ollama">Ollama (local service)</option></select><span className="field-hint">Gemini requires a valid API key. Ollama requires its server and selected model to be running.</span></div>
            <div className="form-group"><label className="form-label" htmlFor="source-doc">Use a reference document <span className="optional-label">Optional</span></label><select id="source-doc" className="form-select" value={sourceDocument} onChange={(event) => setSourceDocument(event.target.value)}><option value="">Generate without a source</option>{documents.map((document) => <option key={document.name} value={document.name} disabled={document.indexed === false}>{document.name}{document.indexed === false ? " — not indexed" : ""}</option>)}</select>
              {selectedSource?.indexed === false && <span className="field-hint field-hint--error">This document has no index and cannot be used as a source right now.</span>}
            </div>
            <Button type="submit" variant="primary" size="md" className="btn--full" icon={<Icon name="sparkles" size={17} />} loading={busy === "generate"} disabled={!prompt.trim() || !!busy || selectedSource?.indexed === false}>Generate draft</Button>
          </form>
          {retrievedChunks.length > 0 && <details className="retrieved-context"><summary>Retrieved source passages <span>{retrievedChunks.length}</span></summary>{retrievedChunks.map((chunk, index) => <blockquote className="context-chunk" key={`source-${index}`}>{chunk}</blockquote>)}</details>}
        </section>

        <section className="document-editor-card" aria-label="Generated document editor">
          <header className="editor-toolbar"><div><span className="section-kicker">YOUR DRAFT</span><h2>Review and export</h2></div><span className="word-count">{wordCount} words</span></header>
          <div className="editor-title-row"><label htmlFor="doc-title">Document title</label><input id="doc-title" className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <label className="sr-only" htmlFor="doc-content">Generated document content</label>
          <textarea id="doc-content" className="document-editor" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Your generated draft will appear here. You can make edits before exporting." />
          <footer className="editor-footer"><span className="editor-disclaimer">AI drafts can contain errors. Review before sharing.</span><div className="editor-actions"><Button variant="secondary" size="sm" icon={<Icon name="copy" size={16} />} onClick={copyContent} disabled={!content.trim() || !!busy}>Copy</Button><Button variant="secondary" size="sm" icon={<Icon name="download" size={16} />} onClick={() => exportFile("docx")} loading={busy === "docx"} disabled={!content.trim() || !!busy}>DOCX</Button><Button variant="primary" size="sm" icon={<Icon name="download" size={16} />} onClick={() => exportFile("pdf")} loading={busy === "pdf"} disabled={!content.trim() || !!busy}>PDF</Button></div></footer>
        </section>
      </div>
    </AppLayout>
  );
}

export default GenerateDocument;
