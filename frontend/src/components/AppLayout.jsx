import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function AppLayout({ children, title, subtitle }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && (
        <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
      )}
      <div className="app-content">
        <Navbar title={title} subtitle={subtitle} onMenuToggle={() => setMenuOpen((open) => !open)} menuOpen={menuOpen} />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
