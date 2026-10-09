import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { api } from "../lib/api";

const starterQuestions = [
  "Summarize the key points",
  "What actions are recommended?",
  "Find dates and deadlines",
];

function historyMessages(items, name) {
  return items.filter((item) => item.document_name === name).reverse().flatMap((item) => [
    { id: `q-${item.id}`, sender: "user", text: item.question },
    { id: `a-${item.id}`, sender: "ai", text: item.answer, sources: [] },
  ]);
}

function AIChat() {
  const [params] = useSearchParams();
  const requestedDocument = params.get("document") || "";
  const [question, setQuestion] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(requestedDocument);
  const [messages, setMessages] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const currentDocument = documents.find((item) => item.name === selectedDocument);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.documents(), api.chatHistory()]).then(([docsResult, historyResult]) => {
      if (!active) return;
      if (docsResult.status === "rejected") {
        setError(docsResult.reason.message);
        setLoadingDocuments(false);
        return;
      }
      const docs = docsResult.value;
      setDocuments(docs);
      const selected = docs.some((item) => item.name === requestedDocument) ? requestedDocument : (docs[0]?.name || "");
      setSelectedDocument(selected);
      if (historyResult.status === "fulfilled") setMessages(historyMessages(historyResult.value, selected));
      else setError(historyResult.reason.message);
      setLoadingDocuments(false);
    });
    return () => { active = false; };
  }, [requestedDocument]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, loading]);

  const changeDocument = async (name) => {
    setSelectedDocument(name);
    setMessages([]);
    setError("");
    setLoadingHistory(true);
    try {
      setMessages(historyMessages(await api.chatHistory(), name));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const askQuestion = async (event) => {
    event.preventDefault();
    const current = question.trim();
    if (!current || !selectedDocument || loading || currentDocument?.indexed === false) return;
    setError("");
    setLoading(true);
    try {
      const result = await api.ask(selectedDocument, current);
      const turnId = `turn-${Date.now()}`;
      setMessages((previous) => [...previous,
        { id: `${turnId}-question`, sender: "user", text: current },
        { id: `${turnId}-answer`, sender: "ai", text: result.answer, sources: Array.isArray(result.sources) ? result.sources : [] },
      ]);
      setQuestion("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = !selectedDocument || loading || currentDocument?.indexed === false;

  return (
    <AppLayout title="AI document chat" subtitle="Ask questions about a document in your personal library.">
      {error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{error}</span></div>}
      {loadingDocuments ? (
        <div className="empty-panel" role="status">Loading your document workspace…</div>
      ) : documents.length === 0 ? (
        <div className="empty-panel"><div className="empty-icon"><Icon name="documents" size={23} /></div><h3>No source documents yet</h3><p>Upload and index a document before starting a conversation.</p><Link to="/upload" className="button-link"><Button variant="primary" icon={<Icon name="upload" size={16} />}>Upload a document</Button></Link></div>
      ) : (
        <section className="chat-workspace" aria-label="Document question and answer workspace">
          <div className="chat-toolbar">
            <div className="chat-source-select">
              <span className="chat-source-icon"><Icon name="documents" size={18} /></span>
              <div className="chat-source-field"><label htmlFor="document-select">SOURCE DOCUMENT</label>
                <select id="document-select" value={selectedDocument} onChange={(event) => changeDocument(event.target.value)}>
                  {documents.map((document) => <option key={document.name} value={document.name}>{document.name}</option>)}
                </select>
              </div>
              <span className={`chat-index-badge ${currentDocument?.indexed === false ? "chat-index-badge--off" : ""}`}><span />{currentDocument?.indexed === false ? "Not indexed" : currentDocument?.indexed === true ? "Indexed" : "Index status unknown"}</span>
            </div>
            <div className="chat-toolbar-note"><span className="privacy-dot" />Private to your account</div>
          </div>

          {currentDocument?.indexed === false && <div className="chat-blocked-note" role="status"><Icon name="warning" /><span>This document does not have a saved search index. Upload it again after indexing is available.</span><Link to="/upload">Upload document</Link></div>}

          <div className="chat-thread" aria-live="polite">
            {!messages.length && !loading && !loadingHistory && <div className="chat-intro"><span className="chat-intro-icon"><Icon name="sparkles" size={22} /></span><span className="chat-intro-label">DOCUMENT ASSISTANT</span><h2>What would you like to know?</h2><p>Answers are requested from the selected document. If retrieval or the AI service fails, you’ll see an error instead of a made-up answer.</p>
              <div className="starter-questions">{starterQuestions.map((item) => <button key={item} type="button" disabled={disabled} onClick={() => setQuestion(item)}>{item}<Icon name="arrow" size={14} /></button>)}</div>
            </div>}
            {loadingHistory && <div className="chat-history-loading" role="status">Loading saved conversation…</div>}
            {messages.map((message) => message.sender === "user" ? (
              <article className="chat-turn chat-turn--user" key={message.id}><span className="chat-avatar chat-avatar--user">You</span><div className="chat-turn-content"><span className="chat-turn-label">You</span><p>{message.text}</p></div></article>
            ) : (
              <article className="chat-turn" key={message.id}><span className="chat-avatar chat-avatar--ai"><Icon name="sparkles" size={17} /></span><div className="chat-turn-content"><span className="chat-turn-label">DocuMind AI</span><p>{message.text}</p>
                {message.sources?.length > 0 && <div className="source-citations"><span className="source-citations-title">RETRIEVED PASSAGES</span>{message.sources.map((source, index) => <blockquote key={`${message.id}-source-${index}`}><span>Passage {index + 1}</span>{source}</blockquote>)}</div>}
              </div></article>
            ))}
            {loading && <div className="chat-turn chat-turn--pending" role="status"><span className="chat-avatar chat-avatar--ai"><Icon name="sparkles" size={17} /></span><div><span className="chat-turn-label">DocuMind AI</span><p>Searching the selected document…</p><span className="loading-dots"><i /><i /><i /></span></div></div>}
            <div ref={endRef} />
          </div>

          <form className="chat-composer" onSubmit={askQuestion}>
            <label className="sr-only" htmlFor="chat-question">Ask a question about this document</label>
            <textarea id="chat-question" rows="1" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about this document…" disabled={disabled} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
            <div className="composer-footer"><span>Enter to send <i /> Shift + Enter for a new line</span><Button type="submit" variant="primary" size="sm" icon={<Icon name="send" size={16} />} disabled={disabled || !question.trim()} loading={loading}>Send</Button></div>
          </form>
        </section>
      )}
    </AppLayout>
  );
}

export default AIChat;
