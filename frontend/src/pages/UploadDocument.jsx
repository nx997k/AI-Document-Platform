import { useState } from "react";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";

function UploadDocument() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout
      title="Upload Document"
      subtitle="Add PDF, DOC, or TXT files to your knowledge base"
    >
      <div className="glass-card">
        <div className={`upload-zone${file ? " upload-zone--active" : ""}`}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0] || null)}
            accept=".pdf,.doc,.docx,.txt"
          />
          <div className="upload-zone-icon">📁</div>
          <div className="upload-zone-title">
            {file ? "Ready to process" : "Drag & drop your file"}
          </div>
          <div className="upload-zone-hint">
            Supports PDF, DOC, DOCX, and TXT formats
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
            disabled={!file}
            icon="↑"
          >
            Upload & Index
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setFile(null)}
            disabled={!file}
          >
            Clear
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

export default UploadDocument;
