import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { api } from "../lib/api";

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileType(name = "") {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");
  const [deleting, setDeleting] = useState("");
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    setChatError("");
    const [docsResult, historyResult] = await Promise.allSettled([api.documents(), api.chatHistory()]);
    if (docsResult.status === "fulfilled") setDocuments(docsResult.value);
    else setError(docsResult.reason.message);
    if (historyResult.status === "fulfilled") setHistory(historyResult.value);
    else setChatError(historyResult.reason.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.documents(), api.chatHistory()]).then(([docsResult, historyResult]) => {
      if (!active) return;
      if (docsResult.status === "fulfilled") setDocuments(docsResult.value);
      else setError(docsResult.reason.message);
      if (historyResult.status === "fulfilled") setHistory(historyResult.value);
      else setChatError(historyResult.reason.message);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const recent = useMemo(() => [...documents].sort((a, b) => b.uploaded_at - a.uploaded_at).slice(0, 5), [documents]);
  const storage = documents.reduce((total, document) => total + (Number(document.size) || 0), 0);
  const indexedCount = documents.length === 0 ? 0 : documents.every((document) => typeof document.indexed === "boolean")
    ? documents.filter((document) => document.indexed).length
    : null;
  const queryCount = history.length;

  const removeDocument = async (name) => {
    if (!window.confirm(`Delete “${name}”? This removes the uploaded file and its saved index.`)) return;
    setDeleting(name);
    setError("");
    try {
      await api.removeDocument(name);
      setDocuments((items) => items.filter((item) => item.name !== name));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting("");
    }
  };

  const stats = [
    { label: "Total documents", value: loading ? "—" : error ? "—" : documents.length, note: "Files in your library", icon: "documents", tone: "blue" },
    { label: "Storage used", value: loading ? "—" : error ? "—" : formatBytes(storage), note: "Across uploaded files", icon: "database", tone: "violet" },
    { label: "Documents indexed", value: loading ? "—" : error ? "—" : indexedCount ?? "—", note: indexedCount === null ? "Status unavailable" : "Ready for document search", icon: "check", tone: "green" },
    { label: "AI questions", value: loading ? "—" : chatError ? "—" : queryCount, note: history.length >= 100 ? "Latest 100 history entries" : "Saved in your chat history", icon: "chat", tone: "amber" },
  ];

  return (
    <AppLayout title="Overview" subtitle="A clear view of your document workspace.">
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="eyebrow"><span className="eyebrow-mark" /> YOUR DOCUMENT WORKSPACE</span>
          <h2>{user.username ? `Good to have you here, ${user.username}.` : "Your documents, intelligently organized."}</h2>
          <p>Bring your files together, explore their contents with AI, and turn your source material into useful drafts.</p>
          <div className="welcome-actions">
            <Link to="/upload" className="button-link"><Button variant="primary" size="md" icon={<Icon name="upload" size={17} />}>Upload a document</Button></Link>
            <Link to="/aichat" className="welcome-secondary"><Icon name="chat" size={17} /> Open AI chat <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
        <div className="welcome-illustration" aria-hidden="true">
          <div className="illustration-orbit orbit-one" /><div className="illustration-orbit orbit-two" />
          <div className="illustration-paper"><span /><span /><span /><i /></div>
          <div className="illustration-tag"><Icon name="sparkles" size={17} /> Organized</div>
        </div>
      </section>

      {error && <div className="alert alert--error" role="alert"><Icon name="warning" /> <span>{error}</span><button type="button" onClick={refresh}>Try again</button></div>}
      {chatError && <div className="alert alert--warning" role="status"><Icon name="warning" /> <span>AI question totals are unavailable: {chatError}</span></div>}

      <section className="stats-grid" aria-label="Workspace statistics">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className={`stat-icon stat-icon--${stat.tone}`}><Icon name={stat.icon} size={19} /></div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{loading ? <span className="skeleton-line" /> : stat.value}</div>
            <div className="stat-note">{stat.note}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div><span className="section-kicker">YOUR LIBRARY</span><h2>Recent documents</h2><p>Files you’ve added to this workspace.</p></div>
          <Link to="/documents" className="text-link">View all documents <Icon name="arrow" size={16} /></Link>
        </div>
        {loading ? (
          <div className="document-list" role="status"><div className="document-row skeleton-row" /><div className="document-row skeleton-row" /><div className="document-row skeleton-row" /></div>
        ) : !error && recent.length === 0 ? (
          <div className="empty-panel"><div className="empty-icon"><Icon name="documents" size={23} /></div><h3>Your library is ready for its first file</h3><p>Upload a PDF, DOCX, or TXT document to get started.</p><Link to="/upload" className="button-link"><Button variant="secondary" icon={<Icon name="upload" size={16} />}>Upload a document</Button></Link></div>
        ) : !error ? (
          <div className="document-list">
            {recent.map((document) => (
              <article className="document-row" key={document.name}>
                <span className={`file-type-icon file-type-icon--${fileType(document.name).toLowerCase()}`}><Icon name="file" size={20} /></span>
                <div className="document-info"><strong title={document.name}>{document.name}</strong><span>{fileType(document.name)} <i /> {formatBytes(document.size)} <i /> {new Date(document.uploaded_at * 1000).toLocaleDateString()}</span></div>
                <span className={`index-status ${document.indexed ? "index-status--ready" : "index-status--pending"}`}><span />{document.indexed === true ? "Indexed" : document.indexed === false ? "Not indexed" : "Status unavailable"}</span>
                <div className="document-actions">
                  {document.indexed === false ? <span className="action-disabled" title="This document has no saved index">Ask AI</span> : <Link to={`/aichat?document=${encodeURIComponent(document.name)}`} className="text-link">Ask AI <Icon name="arrow" size={15} /></Link>}
                  <button type="button" className="icon-button danger-button" aria-label={`Delete ${document.name}`} title="Delete document" disabled={deleting === document.name} onClick={() => removeDocument(document.name)}><Icon name="trash" size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="dashboard-section quick-section">
        <div className="section-heading"><div><span className="section-kicker">QUICK ACCESS</span><h2>What would you like to do?</h2><p>Pick up a task without losing your place.</p></div></div>
        <div className="quick-grid">
          <Link to="/upload" className="quick-card"><span className="quick-icon quick-icon--blue"><Icon name="upload" /></span><span><strong>Upload a document</strong><small>Add a PDF, DOCX, or text file</small></span><Icon name="arrow" className="quick-arrow" /></Link>
          <Link to="/aichat" className="quick-card"><span className="quick-icon quick-icon--violet"><Icon name="chat" /></span><span><strong>Ask your documents</strong><small>Explore an indexed document</small></span><Icon name="arrow" className="quick-arrow" /></Link>
          <Link to="/generate" className="quick-card"><span className="quick-icon quick-icon--amber"><Icon name="sparkles" /></span><span><strong>Generate a draft</strong><small>Start with a prompt or source</small></span><Icon name="arrow" className="quick-arrow" /></Link>
          <Link to="/documents" className="quick-card"><span className="quick-icon quick-icon--green"><Icon name="documents" /></span><span><strong>Browse your library</strong><small>Find and manage your files</small></span><Icon name="arrow" className="quick-arrow" /></Link>
        </div>
      </section>
    </AppLayout>
  );
}

export default Dashboard;
