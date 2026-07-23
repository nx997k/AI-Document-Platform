import { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";

function AIChat() {
  const [question, setQuestion] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/documents");

      if (!response.ok) {
        throw new Error("Unable to load documents.");
      }

      const data = await response.json();

      setDocuments(data);

      if (data.length > 0) {
        setSelectedDocument(data[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const askQuestion = async (e) => {
    e.preventDefault();

    if (!question.trim() || !selectedDocument) return;

    setLoading(true);

    const currentQuestion = question;

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/ask/${selectedDocument}?question=${encodeURIComponent(
          currentQuestion
        )}`
      );

      if (!response.ok) {
        throw new Error("Unable to get AI response.");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: currentQuestion,
        },
        {
          sender: "ai",
          text: data.answer,
        },
      ]);

      setQuestion("");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: currentQuestion,
        },
        {
          sender: "ai",
          text: "⚠️ " + error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="AI Chat"
      subtitle="Ask questions about your uploaded documents using RAG retrieval"
    >
      <div className="glass-card chat-panel">
        <div className="chat-controls">
          <div className="form-group">
            <label className="form-label" htmlFor="document-select">
              Source Document
            </label>

            <select
              id="document-select"
              className="form-select"
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
            >
              {documents.length === 0 ? (
                <option value="">No documents available</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <form className="chat-input-row" onSubmit={askQuestion}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask anything about your document..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!selectedDocument}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={!selectedDocument || !question.trim()}
            icon="◉"
          >
            Ask AI
          </Button>
        </form>

        <div>
          <h3 className="section-title">Conversation</h3>

          <div className="chat-messages">
            {messages.length === 0 && !loading && (
              <div className="chat-empty">
                <div className="chat-empty-icon">💬</div>
                <p>
                  Start a conversation by asking a question about your
                  document.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-bubble chat-bubble--${msg.sender === "user" ? "user" : "ai"
                  }`}
              >
                <span className="chat-bubble-label">
                  {msg.sender === "user" ? "You" : "AI Assistant"}
                </span>

                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble chat-bubble--ai">
                <div className="chat-typing">
                  <span className="chat-bubble-label">
                    AI Assistant
                  </span>

                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>

                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default AIChat;