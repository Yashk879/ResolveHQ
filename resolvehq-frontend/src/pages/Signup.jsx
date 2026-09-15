import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../api/auth.js";

export default function Signup() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!companyName || !name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({ companyName, name, email, password });
      navigate("/login", {
        replace: true,
        state: { successMessage: "Account created. Please log in." },
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setError(err.response?.data?.message || "That email is already in use.");
      } else if (status === 400) {
        setError(err.response?.data?.message || "All fields are required.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-paper)",
      }}
    >
      <div className="panel" style={{ width: 380, padding: "var(--space-6)" }}>
        <h1 style={{ marginBottom: "var(--space-1)" }}>Create your workspace</h1>
        <p style={{ color: "var(--color-slate-muted)", marginBottom: "var(--space-5)" }}>
          This creates a company and your admin account.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="companyName">Company name</label>
            <input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

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
              autoComplete="new-password"
            />
          </div>

          {error && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Creating workspace…" : "Create workspace"}
          </button>
        </form>

        <p style={{ marginTop: "var(--space-5)", fontSize: 13, color: "var(--color-slate-muted)" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
