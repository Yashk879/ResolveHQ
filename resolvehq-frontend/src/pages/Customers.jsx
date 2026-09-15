import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCustomers, createCustomer } from "../api/customers.js";
import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (search) params.search = search;
        const res = await listCustomers(params);
        if (cancelled) return;
        setCustomers(res.data.customers || []);
      } catch (err) {
        if (cancelled) return;
        setError("Couldn't load customers.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [search]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
        <h1>Customers</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "Add customer"}
        </button>
      </div>

      {showCreate && (
        <CreateCustomerPanel
          onCreated={() => {
            setShowCreate(false);
            setSearch("");
            setSearchInput("");
          }}
        />
      )}

      <div className="panel" style={{ padding: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end" }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 240 }}>
            <label htmlFor="search">Search name or email</label>
            <input id="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search…" />
          </div>
          <button type="submit" className="btn">Search</button>
        </form>
      </div>

      {loading && <Loading label="Loading customers…" />}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="panel" style={{ padding: "var(--space-5)" }}>
          {customers.length === 0 ? (
            <p style={{ color: "var(--color-slate-muted)" }}>No customers yet.</p>
          ) : (
            <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td><Link to={`/customers/${c.id}`}>{c.name}</Link></td>
                    <td>{c.email}</td>
                    <td className="mono">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateCustomerPanel({ onCreated }) {
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createCustomer({ name, email });
      addToast("Customer added.");
      onCreated();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setError(err.response?.data?.message || "This customer already exists.");
      } else {
        setError(err.response?.data?.message || "Couldn't add this customer.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
      <h2 style={{ marginBottom: "var(--space-4)" }}>Add customer</h2>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Adding…" : "Add customer"}
        </button>
      </form>
    </div>
  );
}
