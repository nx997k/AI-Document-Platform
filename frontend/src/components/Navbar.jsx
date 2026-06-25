import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <div className="navbar-logo">✦</div>
        <div>
          <div className="navbar-title">AI Document Platform</div>
        </div>
        <span className="navbar-badge">Pro</span>
      </Link>

      <div className="navbar-actions">
        <div className="navbar-status">
          <span className="navbar-status-dot" />
          RAG Engine Online
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
