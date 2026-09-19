import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const successMessage = location.state?.successMessage;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError(err.response?.data?.message || "Invalid email or password.");
      } else if (status === 400) {
        setError(err.response?.data?.message || "Email and password are required.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hero-bg auth-page">
      <div className="auth-card">
        <h1 style={{ marginBottom: "var(--space-1)" }}>Log in</h1>
        <p style={{ color: "var(--color-slate-muted)", marginBottom: "var(--space-5)" }}>
          Sign in to your ResolveHQ workspace.
        </p>

        {successMessage && (
          <p
            style={{
              color: "var(--color-green)",
              fontSize: 13,
              marginBottom: "var(--space-4)",
            }}
          >
            {successMessage}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <p style={{ marginBottom: "var(--space-4)" }}>
            <Link to="/forgot-password" style={{ fontSize: 13 }}>Forgot password?</Link>
          </p>

          {error && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p style={{ marginTop: "var(--space-5)", fontSize: 13, color: "var(--color-slate-muted)" }}>
          Don't have a workspace? <Link to="/signup">Create one</Link>
        </p>
        <p style={{ marginTop: "var(--space-2)", fontSize: 13, color: "var(--color-slate-muted)" }}>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
