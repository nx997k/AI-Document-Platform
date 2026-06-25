import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BackgroundEffects from "./BackgroundEffects";

function AppLayout({ children, title, subtitle }) {
  return (
    <div className="app-shell">
      <BackgroundEffects />
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {(title || subtitle) && (
            <header className="page-header">
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </header>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
