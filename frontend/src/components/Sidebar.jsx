import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", icon: "◈", label: "Dashboard" },
  { to: "/upload", icon: "↑", label: "Upload" },
  { to: "/documents", icon: "▤", label: "Documents" },
  { to: "/aichat", icon: "◉", label: "AI Chat" },
  { to: "/generate", icon: "✦", label: "Generator" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <span className="sidebar-label">Navigation</span>

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
        >
          <span className="sidebar-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      <div className="sidebar-divider" />

      <NavLink
        to="/"
        className="sidebar-link sidebar-link--logout"
      >
        <span className="sidebar-icon">⏻</span>
        Logout
      </NavLink>
    </aside>
  );
}

export default Sidebar;
