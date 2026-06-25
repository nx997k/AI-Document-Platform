import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";

function Dashboard() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    const response = await fetch("http://127.0.0.1:5000/documents");
    const data = await response.json();
    setDocuments(data);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      alert(data.message);
      setFile(null);
      fetchDocuments();
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Upload documents and manage your AI-powered knowledge base"
    >
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">📚</div>
          <div className="stat-card-value">{documents.length}</div>
          <div className="stat-card-label">Documents Indexed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🤖</div>
          <div className="stat-card-value">Gemini</div>
          <div className="stat-card-label">AI Model Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📎</div>
          <div className="stat-card-value">PDF · DOC · TXT</div>
          <div className="stat-card-label">Supported Formats</div>
        </div>
      </div>

      <div className="glass-card mb-4">
        <h2 className="section-title">Quick Upload</h2>

        <div className={`upload-zone${file ? " upload-zone--active" : ""}`}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0] || null)}
            accept=".pdf,.doc,.docx,.txt"
          />
          <div className="upload-zone-icon">📤</div>
          <div className="upload-zone-title">
            {file ? "File ready to upload" : "Drop your document here"}
          </div>
          <div className="upload-zone-hint">
            or click to browse · PDF, DOC, DOCX, TXT
          </div>
          {file && (
            <div className="upload-zone-file">{file.name}</div>
          )}
        </div>

        <div className="action-row">
          <Button
            variant="primary"
            size="lg"
            onClick={handleUpload}
            loading={uploading}
            icon="↑"
          >
            Upload Document
          </Button>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Your Documents</h2>

        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No documents yet. Upload your first file to get started.</p>
          </div>
        ) : (
          <div className="doc-grid">
            {documents.map((doc, index) => (
              <div key={index} className="doc-card">
                <div className="doc-card-icon">📄</div>
                <div>
                  <div className="doc-card-name">{doc}</div>
                  <div className="doc-card-meta">Indexed · Ready for AI chat</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Dashboard;
