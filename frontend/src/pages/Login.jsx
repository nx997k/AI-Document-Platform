import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { api } from "../lib/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.login(email.trim(), password);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="auth-mobile-mark"><Icon name="documents" size={20} /></span>
        <span className="section-kicker">WELCOME BACK</span>
        <h2>Sign in to DocuMind</h2>
        <p className="auth-card-subtitle">Continue to your document workspace.</p>
        {error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{error}</span></div>}
        <form onSubmit={handleLogin}>
          <div className="form-group"><label className="form-label" htmlFor="email">Email address</label><input id="email" type="email" className="form-input" placeholder="you@company.com" autoComplete="email" maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="form-group"><div className="field-label-row"><label className="form-label" htmlFor="password">Password</label></div><input id="password" type="password" className="form-input" placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          <Button type="submit" variant="primary" size="md" className="btn--full auth-submit" loading={loading} icon={<Icon name="arrow" size={16} />}>Sign in</Button>
        </form>
        <p className="auth-switch">New to DocuMind? <Link to="/register">Create an account</Link></p>
      </div>
      <p className="auth-legal">By signing in, you agree to use this workspace responsibly.</p>
    </AuthLayout>
  );
}

export default Login;
