import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomer, getCustomerTickets } from "../api/customers.js";
import TicketList from "../components/TicketList.jsx";
import Loading from "../components/Loading.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const [tickets, setTickets] = useState(null);
  const [ticketsUnavailable, setTicketsUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setNotFound(false);
      try {
        const res = await getCustomer(id);
        if (cancelled) return;
        setCustomer(res.data.customer);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) setNotFound(true);
        else setError("Couldn't load this customer.");
      } finally {
        if (!cancelled) setLoading(false);
      }

      // This endpoint isn't live on the backend yet — fail quietly and
      // show a placeholder instead of an error if it 404s.
      try {
        const res = await getCustomerTickets(id);
        if (cancelled) return;
        setTickets(res.data.tickets || []);
      } catch {
        if (cancelled) return;
        setTicketsUnavailable(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="content"><Loading label="Loading customer…" /></div>;
  if (notFound) return <div className="content"><p>Customer not found.</p></div>;
  if (error) return <div className="content"><p className="error-text">{error}</p></div>;
  if (!customer) return null;

  return (
    <div className="content">
      <button className="btn" style={{ marginBottom: "var(--space-4)" }} onClick={() => navigate("/customers")}>
        ← Back to customers
      </button>

      <div className="panel" style={{ padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>{customer.name}</h1>
        <p style={{ color: "var(--color-slate-muted)", marginBottom: "var(--space-3)" }}>{customer.email}</p>
        <div className="mono" style={{ fontSize: 12, color: "var(--color-slate-muted)" }}>
          Added {formatDate(customer.created_at)}
        </div>
      </div>

      <div className="panel" style={{ padding: "var(--space-5)" }}>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Tickets</h2>
        {ticketsUnavailable ? (
          <p style={{ color: "var(--color-slate-muted)" }}>
            Per-customer ticket history isn't available from the backend yet.
          </p>
        ) : (
          <TicketList tickets={tickets} emptyMessage="This customer has no tickets yet." />
        )}
      </div>
    </div>
  );
}
