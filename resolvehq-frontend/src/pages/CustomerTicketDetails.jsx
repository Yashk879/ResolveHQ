import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import { getOwnTicket, getOwnTicketMessages, replyToOwnTicket } from "../api/customerPortal.js";
import { StatusBadge, PriorityBadge } from "../components/Badges.jsx";
import Loading from "../components/Loading.jsx";
import { socket } from "../socket.js";

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CustomerTicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuth();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const [ticketRes, messagesRes] = await Promise.all([getOwnTicket(id), getOwnTicketMessages(id)]);
      setTicket(ticketRes.data.ticket);
      setMessages(messagesRes.data.messages || []);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      else setError("Couldn't load this ticket.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates, same mechanism as the agent's ticket detail page —
  // see that file for the fuller explanation.
  useEffect(() => {
    function handleNewMessage({ ticketId, message }) {
      if (String(ticketId) !== String(id)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
    socket.on("ticket:message", handleNewMessage);
    return () => socket.off("ticket:message", handleNewMessage);
  }, [id]);

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
        <button className="btn" style={{ marginBottom: "var(--space-4)" }} onClick={() => navigate("/customer/portal")}>
          ← Back to my tickets
        </button>

        {loading && <Loading label="Loading ticket…" />}
        {notFound && <p>Ticket not found.</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !notFound && !error && ticket && (
          <>
            <div className="panel" style={{ padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
              <h1 style={{ marginBottom: "var(--space-2)" }}>{ticket.subject}</h1>
              <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-3)" }}>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <p style={{ marginBottom: "var(--space-4)" }}>{ticket.description}</p>
              <div className="mono" style={{ fontSize: 12, color: "var(--color-slate-muted)" }}>
                Raised {formatDateTime(ticket.created_at)}
              </div>
            </div>

            <ConversationPanel ticketId={id} messages={messages} onSent={load} />
          </>
        )}
      </div>
    </div>
  );
}

function ConversationPanel({ ticketId, messages, onSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    setSending(true);
    try {
      await replyToOwnTicket(ticketId, text.trim());
      setText("");
      onSent();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send your reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--space-5)" }}>
      <h2 style={{ marginBottom: "var(--space-4)" }}>Conversation</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--color-slate-muted)" }}>No replies yet — an agent will get back to you soon.</p>
        )}
        {messages.map((m) => {
          const isMine = m.sender_customer_id != null;
          return (
            <div
              key={m.id}
              style={{
                borderLeft: `2px solid ${isMine ? "var(--color-signal)" : "var(--color-steel)"}`,
                paddingLeft: "var(--space-3)",
              }}
            >
              <div className="mono" style={{ fontSize: 12, color: "var(--color-slate-muted)", marginBottom: "var(--space-1)" }}>
                {isMine ? "You" : "Support agent"} · {formatDateTime(m.created_at)}
              </div>
              <p>{m.messages}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend}>
        <div className="field">
          <label htmlFor="reply">Write a reply</label>
          <textarea id="reply" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        {error && <p className="error-text" style={{ marginBottom: "var(--space-3)" }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
          {sending ? "Sending…" : "Send reply"}
        </button>
      </form>
    </div>
  );
}
