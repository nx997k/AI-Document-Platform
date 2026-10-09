import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { api } from "../lib/api";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.register(username.trim(), email.trim(), password);
      setSuccess("Your account is ready. Taking you to sign in…");
      window.setTimeout(() => navigate("/", { replace: true }), 900);
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
        <span className="section-kicker">YOUR WORKSPACE STARTS HERE</span>
        <h2>Create your account</h2>
        <p className="auth-card-subtitle">Set up your personal DocuMind workspace.</p>
        {error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{error}</span></div>}
        {success && <div className="alert alert--success" role="status"><Icon name="check" /><span>{success}</span></div>}
        <form onSubmit={handleRegister}>
          <div className="form-group"><label className="form-label" htmlFor="username">Name</label><input id="username" type="text" className="form-input" placeholder="Your name" autoComplete="name" maxLength={100} value={username} onChange={(event) => setUsername(event.target.value)} required /></div>
          <div className="form-group"><label className="form-label" htmlFor="email">Email address</label><input id="email" type="email" className="form-input" placeholder="you@company.com" autoComplete="email" maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="form-group"><label className="form-label" htmlFor="password">Password</label><input id="password" type="password" className="form-input" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /><span className="field-hint">Use 8–72 characters.</span></div>
          <Button type="submit" variant="primary" size="md" className="btn--full auth-submit" loading={loading} icon={<Icon name="arrow" size={16} />}>Create account</Button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/">Sign in</Link></p>
      </div>
      <p className="auth-legal">Your account is protected with password-based authentication.</p>
    </AuthLayout>
  );
}

export default Register;
