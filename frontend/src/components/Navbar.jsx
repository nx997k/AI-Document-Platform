import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Icon from "./Icon";

function Navbar({ title, subtitle, onMenuToggle, menuOpen }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const searchDocuments = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(`/documents${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <header className="topbar">
      <button className="mobile-menu-button" type="button" onClick={onMenuToggle} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>
        <Icon name={menuOpen ? "close" : "menu"} />
      </button>
      <div className="topbar-heading">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-actions">
        <form className="global-search" role="search" onSubmit={searchDocuments}>
          <Icon name="search" size={17} />
          <label className="sr-only" htmlFor="global-document-search">Search documents</label>
          <input id="global-document-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" />
          <kbd>Enter</kbd>
        </form>
        <Button variant="primary" size="sm" icon={<Icon name="plus" size={16} />} onClick={() => navigate("/upload")} className="topbar-upload">Upload document</Button>
      </div>
    </header>
  );
}

export default Navbar;
