import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import { createOwnTicket, listOwnTickets } from "../api/customerPortal.js";
import { StatusBadge, PriorityBadge } from "../components/Badges.jsx";
import Loading from "../components/Loading.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CustomerPortal() {
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listOwnTickets();
      setTickets(res.data.tickets || []);
    } catch (err) {
      setError("Couldn't load your tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate("/customer/login", { replace: true });
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-paper)" }}>
      <header className="topbar">
        <Link to="/customer/portal" style={{ fontWeight: 600, color: "inherit", textDecoration: "none" }}>
          ResolveHQ Support
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginLeft: "auto" }}>
          <span style={{ color: "var(--color-slate-muted)", fontSize: 13 }}>{customer?.name}</span>
          <button className="btn" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </header>

      <div className="content" style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
          <h1>My tickets</h1>
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Raise a ticket"}
          </button>
        </div>

        {showForm && (
          <NewTicketPanel
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        )}

        {loading && <Loading label="Loading your tickets…" />}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <div className="panel" style={{ padding: "var(--space-5)" }}>
            {tickets.length === 0 ? (
              <p style={{ color: "var(--color-slate-muted)" }}>
                You haven't raised any tickets yet.
              </p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Raised</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id}>
                        <td><Link to={`/customer/portal/tickets/${t.id}`}>{t.subject}</Link></td>
                        <td><StatusBadge status={t.status} /></td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td className="mono">{formatDate(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NewTicketPanel({ onCreated }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!subject || !description) {
      setError("Subject and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      // Priority is intentionally not set here — that's a triage decision
      // for the support team, not the customer. The backend defaults it
      // to "low" when omitted.
      await createOwnTicket({ subject, description });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit your ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
      <h2 style={{ marginBottom: "var(--space-4)" }}>Raise a ticket</h2>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="description">Describe the issue</label>
          <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {error && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit ticket"}
        </button>
      </form>
    </div>
  );
}
