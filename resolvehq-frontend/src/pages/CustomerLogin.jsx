import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { listCompanies } from "../api/companies.js";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";

export default function CustomerLogin() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const successMessage = location.state?.successMessage;

  useEffect(() => {
    listCompanies()
      .then((res) => setCompanies(res.data.companies || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!companyId || !email || !password) {
      setError("Company, email, and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ companyId: Number(companyId), email, password });
      navigate("/customer/portal", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hero-bg auth-page">
      <div className="auth-card">
        <h1 style={{ marginBottom: "var(--space-1)" }}>Log in</h1>
        <p style={{ color: "var(--color-slate-muted)", marginBottom: "var(--space-5)" }}>
          Access your support tickets.
        </p>

        {successMessage && (
          <p style={{ color: "var(--color-green)", fontSize: 13, marginBottom: "var(--space-4)" }}>
            {successMessage}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="company">Company</label>
            <select id="company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Select a Company
</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
              autoComplete="current-password"
            />
          </div>

          {error && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p style={{ marginTop: "var(--space-5)", fontSize: 13, color: "var(--color-slate-muted)" }}>
          Don't have an account? <Link to="/customer/signup">Sign up</Link>
        </p>
        <p style={{ marginTop: "var(--space-2)", fontSize: 13, color: "var(--color-slate-muted)" }}>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
