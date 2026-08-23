import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";

function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
  setLoading(true);

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please login again.");
    }

    const response = await fetch(
      "http://127.0.0.1:5000/documents",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.msg ||
        data.message ||
        "Unable to load documents."
      );
    }

    if (!Array.isArray(data)) {
      throw new Error("Invalid documents response.");
    }

    setDocuments(data);

  } catch (error) {
    console.error(error);
    setDocuments([]);
    alert(error.message);

  } finally {
    setLoading(false);
  }
};

  return (
    <AppLayout
      title="My Documents"
      subtitle="All indexed documents available for AI retrieval"
    >
      <div className="glass-card">
        <div className="action-row" style={{ justifyContent: "flex-end", marginTop: 0, marginBottom: 24 }}>
          <Link to="/upload">
            <Button variant="secondary" size="sm" icon="+">
              Upload New
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="typing-dots" style={{ justifyContent: "center", marginBottom: 12 }}>
              <span />
              <span />
              <span />
            </div>
            <p>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <p>No documents found in your library.</p>
            <div className="action-row">
              <Link to="/upload">
                <Button variant="primary" icon="↑">
                  Upload Your First Document
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="doc-grid">
            {documents.map((doc, index) => (
              <div key={index} className="doc-card glass-card--interactive">
                <div className="doc-card-icon">📄</div>
                <div>
                  <div className="doc-card-name">{doc}</div>
                  <div className="doc-card-meta">Vector indexed · FAISS ready</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default MyDocuments;
