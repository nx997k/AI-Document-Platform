import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { api } from "../lib/api";

function formatSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function MyDocuments() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");
  const search = params.get("search") || "";

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setDocuments(await api.documents()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    api.documents().then((items) => { if (active) setDocuments(items); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => documents.filter((document) => document.name.toLowerCase().includes(search.trim().toLowerCase())), [documents, search]);
  const indexedCount = documents.filter((document) => document.indexed === true).length;

  const updateSearch = (value) => {
    const next = new URLSearchParams(params);
    if (value.trim()) next.set("search", value.trim());
    else next.delete("search");
    setParams(next, { replace: true });
  };

  const remove = async (name) => {
    if (!window.confirm(`Delete “${name}”? This removes the uploaded file and its saved index.`)) return;
    setDeleting(name);
    setError("");
    try { await api.removeDocument(name); setDocuments((items) => items.filter((item) => item.name !== name)); }
    catch (err) { setError(err.message); }
    finally { setDeleting(""); }
  };

  return (
    <AppLayout title="My documents" subtitle="Manage your personal document library and search-ready files.">
      <section className="library-summary">
        <div><span className="section-kicker">DOCUMENT LIBRARY</span><h2>Your files, all in one place</h2><p>{loading ? "Loading your library…" : `${documents.length} ${documents.length === 1 ? "document" : "documents"} · ${indexedCount} indexed`}</p></div>
        <Link to="/upload" className="button-link"><Button variant="primary" icon={<Icon name="upload" size={16} />}>Upload document</Button></Link>
      </section>

      {location.state?.uploaded && <div className="alert alert--success" role="status"><Icon name="check" /><span>{location.state.uploaded} uploaded successfully.</span></div>}

      <div className="library-toolbar">
        <div className="library-search"><Icon name="search" size={17} /><label htmlFor="library-search" className="sr-only">Search your documents</label><input id="library-search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Filter by file name" /></div>
        <span className="library-count">{loading ? "—" : `${filtered.length} shown`}</span>
      </div>

      {error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{error}</span><button type="button" onClick={refresh}>Try again</button></div>}
      {loading ? (
        <div className="document-list" role="status"><div className="document-row skeleton-row" /><div className="document-row skeleton-row" /><div className="document-row skeleton-row" /></div>
      ) : !error && documents.length === 0 ? (
        <div className="empty-panel"><div className="empty-icon"><Icon name="documents" size={23} /></div><h3>Your library is empty</h3><p>Upload a PDF, DOCX, or TXT file to get started.</p><Link to="/upload" className="button-link"><Button variant="secondary" icon={<Icon name="upload" size={16} />}>Upload your first document</Button></Link></div>
      ) : !error && filtered.length === 0 ? (
        <div className="empty-panel empty-panel--compact"><div className="empty-icon"><Icon name="search" size={22} /></div><h3>No matching documents</h3><p>Try a different file name or clear your search.</p><button type="button" className="text-link" onClick={() => updateSearch("")}>Clear search</button></div>
      ) : !error ? (
        <div className="document-list document-list--library">
          {filtered.map((document) => {
            const extension = document.name.split(".").pop().toUpperCase();
            return (
              <article className="document-row" key={document.name}>
                <span className={`file-type-icon file-type-icon--${extension.toLowerCase()}`}><Icon name="file" size={20} /></span>
                <div className="document-info"><strong title={document.name}>{document.name}</strong><span>{extension} <i /> {formatSize(document.size)} <i /> Uploaded {new Date(document.uploaded_at * 1000).toLocaleDateString()}</span></div>
                <span className={`index-status ${document.indexed ? "index-status--ready" : "index-status--pending"}`}><span />{document.indexed === true ? "Indexed" : document.indexed === false ? "Not indexed" : "Status unavailable"}</span>
                <div className="document-actions">
                  {document.indexed === false ? <span className="action-disabled" title="This document has no saved index">Ask AI</span> : <Link to={`/aichat?document=${encodeURIComponent(document.name)}`} className="text-link">Ask AI <Icon name="arrow" size={15} /></Link>}
                  <button type="button" className="icon-button danger-button" aria-label={`Delete ${document.name}`} title="Delete document" disabled={deleting === document.name} onClick={() => remove(document.name)}><Icon name="trash" size={17} /></button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </AppLayout>
  );
}

export default MyDocuments;
