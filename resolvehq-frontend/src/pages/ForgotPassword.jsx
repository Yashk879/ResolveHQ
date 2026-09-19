import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Enter your email.");
      return;
    }

    setSubmitting(true);
    try {
      // The backend always responds the same way whether or not the
      // email is registered, so we can't (and shouldn't) tell the user
      // which — just show the generic confirmation either way.
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hero-bg auth-page">
      <div className="auth-card">
        <h1 style={{ marginBottom: "var(--space-1)" }}>Reset your password</h1>
        <p style={{ color: "var(--color-slate-muted)", marginBottom: "var(--space-5)" }}>
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <p style={{ color: "var(--color-green)", fontSize: 14 }}>
            If an account with that email exists, a reset link has been sent. Check your inbox.
          </p>
        ) : (
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

            {error && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p style={{ marginTop: "var(--space-5)", fontSize: 13, color: "var(--color-slate-muted)" }}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
