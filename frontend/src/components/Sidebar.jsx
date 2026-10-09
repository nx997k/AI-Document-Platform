import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "../lib/api";
import Icon from "./Icon";

const navItems = [
  { to: "/dashboard", icon: "dashboard", label: "Overview", end: true },
  { to: "/documents", icon: "documents", label: "My documents" },
  { to: "/upload", icon: "upload", label: "Upload documents" },
  { to: "/aichat", icon: "chat", label: "AI chat" },
  { to: "/generate", icon: "sparkles", label: "Document studio" },
];

function Sidebar({ open, onNavigate }) {
  const navigate = useNavigate();
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();
  const initials = (user.username || user.email || "U").trim().slice(0, 1).toUpperCase();
  const logout = () => { signOut(); navigate("/", { replace: true }); onNavigate?.(); };

  return (
    <aside className={`sidebar${open ? " sidebar--open" : ""}`} aria-label="Main navigation">
      <Link to="/dashboard" className="sidebar-brand" onClick={onNavigate}>
        <span className="brand-mark"><Icon name="documents" size={21} /></span>
        <span className="brand-wordmark">DocuMind<span> AI</span><small>DOCUMENT INTELLIGENCE</small></span>
      </Link>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <Icon name={item.icon} size={19} /><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="workspace-note"><span className="status-dot" /><span><strong>Personal workspace</strong><small>Your documents stay private</small></span></div>
        <div className="sidebar-user">
          <span className="user-avatar">{initials}</span>
          <span className="sidebar-user-meta"><strong>{user.username || "Your account"}</strong><small title={user.email || ""}>{user.email || "Signed in"}</small></span>
          <button type="button" className="logout-button" onClick={logout} aria-label="Sign out" title="Sign out"><Icon name="logout" size={18} /></button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
