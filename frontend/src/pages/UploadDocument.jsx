import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { api } from "../lib/api";

const ACCEPTED = ["pdf", "docx", "txt"];
const MAX_SIZE = 20 * 1024 * 1024;

function formatSize(size) {
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`;
}

function UploadDocument() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const chooseFile = (picked) => {
    setError("");
    if (!picked) return;
    const extension = picked.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(extension)) {
      setFile(null);
      setError("This file type is not supported. Choose a PDF, DOCX, or TXT file.");
      return;
    }
    if (picked.size > MAX_SIZE) {
      setFile(null);
      setError("Files must be 20 MB or smaller.");
      return;
    }
    setFile(picked);
  };

  const upload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      await api.upload(file);
      navigate("/documents", { state: { uploaded: file.name } });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <AppLayout title="Upload documents" subtitle="Add a source file to your personal workspace.">
      <section className="upload-page-grid">
        <div className="upload-main-card">
          <div className="upload-card-heading"><span className="section-kicker">ADD TO YOUR LIBRARY</span><h2>Bring a document into DocuMind</h2><p>We’ll extract its text and prepare it for document search.</p></div>
          {error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{error}</span></div>}
          <button
            type="button"
            className={`upload-zone${file ? " upload-zone--active" : ""}${dragging ? " upload-zone--dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }}
            aria-label="Choose or drop a document file"
          >
            <input ref={inputRef} className="file-input-hidden" type="file" accept=".pdf,.docx,.txt" onChange={(event) => chooseFile(event.target.files?.[0])} />
            <span className="upload-zone-icon"><Icon name={file ? "file" : "upload"} size={23} /></span>
            <strong className="upload-zone-title">{file ? "Document ready to upload" : "Drop a file here or browse"}</strong>
            <span className="upload-zone-hint">PDF, DOCX, or TXT · up to 20 MB</span>
            {file && <span className="upload-selected-file"><Icon name="file" size={17} /><strong>{file.name}</strong><span>{formatSize(file.size)}</span></span>}
          </button>
          <div className="upload-actions">
            <Button variant="primary" size="md" icon={<Icon name="upload" size={16} />} onClick={upload} loading={uploading} disabled={!file || uploading}>{uploading ? "Processing document" : "Upload and index"}</Button>
            {file && <button type="button" className="text-button" onClick={clearFile} disabled={uploading}>Remove file</button>}
          </div>
          {uploading && <p className="upload-progress-note" role="status">Extracting text and creating the document index. This may take a moment.</p>}
        </div>
        <aside className="upload-guidance">
          <div className="guidance-icon"><Icon name="check" size={18} /></div><h3>Before you upload</h3>
          <ul><li>Choose a text-readable PDF, DOCX, or TXT file.</li><li>Keep the file under 20 MB.</li><li>Documents are private to your account.</li></ul>
          <div className="guidance-divider" /><p>Already uploaded a file?</p><Link to="/documents" className="text-link">Go to your library <Icon name="arrow" size={15} /></Link>
        </aside>
      </section>
    </AppLayout>
  );
}

export default UploadDocument;
