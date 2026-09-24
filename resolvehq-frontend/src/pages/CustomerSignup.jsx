import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listCompanies } from "../api/companies.js";
import { customerSignup } from "../api/customerAuth.js";

export default function CustomerSignup() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [companiesError, setCompaniesError] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCompanies()
      .then((res) => setCompanies(res.data.companies || []))
      .catch(() => setCompaniesError("Couldn't load the list of companies."));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!companyId || !name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      await customerSignup({ companyId: Number(companyId), name, email, password });
      navigate("/customer/login", {
        replace: true,
        state: { successMessage: "Account created. Please log in." },
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setError(err.response?.data?.message || "An account with this email already exists.");
      } else {
        setError(err.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hero-bg auth-page">
      <div className="auth-card">
        <h1 style={{ marginBottom: "var(--space-1)" }}>Create your account</h1>
        <p style={{ color: "var(--color-slate-muted)", marginBottom: "var(--space-5)" }}>
          Sign up to raise and track support tickets.
        </p>

        {companiesError && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{companiesError}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="company">Company</label>
            <select id="company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Which company are you contacting?</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p style={{ marginTop: "var(--space-5)", fontSize: 13, color: "var(--color-slate-muted)" }}>
          Already have an account? <Link to="/customer/login">Log in</Link>
        </p>
        <p style={{ marginTop: "var(--space-2)", fontSize: 13, color: "var(--color-slate-muted)" }}>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
