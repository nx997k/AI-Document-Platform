import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BackgroundEffects from "../components/BackgroundEffects";
import Button from "../components/Button";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.message === "Login successful") {

        localStorage.setItem(
           "user",
        JSON.stringify(data.user)
        );

         navigate("/dashboard");

      }else{

        alert(data.message);

      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <BackgroundEffects />

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">✦</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to access your AI-powered document workspace
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="btn--full"
              loading={loading}
              icon="→"
            >
              Sign In
            </Button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">🔒</span>
              Secure
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">⚡</span>
              RAG Powered
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">📄</span>
              Multi-format
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
