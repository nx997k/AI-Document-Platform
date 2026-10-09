import { Link } from "react-router-dom";
import Icon from "./Icon";

function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Link to="/" className="auth-brand"><span className="brand-mark"><Icon name="documents" size={21} /></span><span className="brand-wordmark">DocuMind<span> AI</span><small>DOCUMENT INTELLIGENCE</small></span></Link>
        <div className="auth-aside-copy"><span className="eyebrow"><span className="eyebrow-mark" /> YOUR KNOWLEDGE, IN REACH</span><h1>Make every document easier to work with.</h1><p>Organize your files, explore their contents, and shape ideas into polished drafts in one focused workspace.</p>
          <div className="auth-feature-list"><div><span><Icon name="documents" size={17} /></span><p><strong>One private library</strong><small>Keep your working files together</small></p></div><div><span><Icon name="chat" size={17} /></span><p><strong>Document conversations</strong><small>Ask questions about your sources</small></p></div><div><span><Icon name="sparkles" size={17} /></span><p><strong>Thoughtful first drafts</strong><small>Turn a brief into a starting point</small></p></div></div>
        </div>
        <p className="auth-aside-footer">A calmer way to work with documents.</p>
      </section>
      <section className="auth-form-side">{children}</section>
    </main>
  );
}

export default AuthLayout;
