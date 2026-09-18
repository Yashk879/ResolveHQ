import { useEffect, useState } from "react";
import { listTickets, createTicket } from "../api/tickets.js";
import { listCustomers } from "../api/customers.js";
import TicketList from "../components/TicketList.jsx";
import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];
const PAGE_SIZE = 10;

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const { socket } = useSocket();
  const { addToast } = useToast();


  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit: PAGE_SIZE };
        if (status) params.status = status;
        if (priority) params.priority = priority;
        if (search) params.search = search;

        const res = await listTickets(params);
        if (cancelled) return;
        setTickets(res.data.tickets || []);
      } catch (err) {
        if (cancelled) return;
        setError("Couldn't load tickets. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, priority, search, page]);

  useEffect(() => {
    if (!socket) return;

    function handleTicketCreated(newTicket) {
      const matchesStatus = !status || newTicket.status === status;
      const matchesPriority = !priority || newTicket.priority === priority;
      const matchesSearch =
        !search ||
        (newTicket.subject &&
          newTicket.subject.toLowerCase().includes(search.toLowerCase()));

      if (matchesStatus && matchesPriority && matchesSearch) {
        setTickets((prev) => {
          if (prev.some((t) => t.id === newTicket.id)) return prev;
          return [newTicket, ...prev];
        });
      }
      addToast(`New ticket: "${newTicket.subject}"`);
    }

    function handleTicketUpdated(updatedTicket) {
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === updatedTicket.id);
        if (!exists) return prev;

        const matchesStatus = !status || updatedTicket.status === status;
        const matchesPriority = !priority || updatedTicket.priority === priority;
        const matchesSearch =
          !search ||
          (updatedTicket.subject &&
            updatedTicket.subject.toLowerCase().includes(search.toLowerCase()));

        if (!matchesStatus || !matchesPriority || !matchesSearch) {
          return prev.filter((t) => t.id !== updatedTicket.id);
        }

        return prev.map((t) =>
          t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t
        );
      });
    }

    function handleTicketDeleted(data) {
      setTickets((prev) => prev.filter((t) => t.id !== Number(data.id)));
    }

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:deleted", handleTicketDeleted);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:deleted", handleTicketDeleted);
    };
  }, [socket, status, priority, search, addToast]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleFilterChange(setter) {
    return (e) => {
      setPage(1);
      setter(e.target.value);
    };
  }

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
        <h1>Tickets</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "New ticket"}
        </button>
      </div>

      {showCreate && (
        <CreateTicketPanel
          onCreated={() => {
            setShowCreate(false);
            setPage(1);
            setStatus("");
            setPriority("");
            setSearch("");
            setSearchInput("");
          }}
        />
      )}
      <div className="panel" style={{ padding: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
            <label htmlFor="search">Search subject</label>
            <input id="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search…" />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={handleFilterChange(setStatus)}>
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="priority">Priority</label>
            <select id="priority" value={priority} onChange={handleFilterChange(setPriority)}>
              <option value="">All</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn">Search</button>
        </form>
      </div>

      {loading && <Loading label="Loading tickets…" />}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="panel" style={{ padding: "var(--space-5)" }}>
          <TicketList tickets={tickets} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-4)" }}>
            <span style={{ fontSize: 13, color: "var(--color-slate-muted)" }}>Page {page}</span>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="btn" disabled={tickets.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateTicketPanel({ onCreated }) {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [customersError, setCustomersError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCustomers()
      .then((res) => setCustomers(res.data.customers || []))
      .catch(() => setCustomersError("Couldn't load customers."));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!customerId || !subject || !description) {
      setError("Customer, subject, and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createTicket({ customerId: Number(customerId), subject, description, priority });
      addToast("Ticket created.");
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
      <h2 style={{ marginBottom: "var(--space-4)" }}>New ticket</h2>

      {customersError && <p className="error-text" style={{ marginBottom: "var(--space-3)" }}>{customersError}</p>}

      {customers.length === 0 && !customersError && (
        <p style={{ color: "var(--color-slate-muted)", marginBottom: "var(--space-4)" }}>
          No customers yet — add one on the Customers page first.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="customer">Customer</label>
          <select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {error && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create ticket"}
        </button>
      </form>
    </div>
  );
}
