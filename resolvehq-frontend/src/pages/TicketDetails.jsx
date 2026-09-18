import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getTicket, updateTicket, assignTicket, deleteTicket } from "../api/tickets.js";
import { getMessages, replyToTicket } from "../api/messages.js";
import { listAgents } from "../api/agents.js";
import { StatusBadge, PriorityBadge } from "../components/Badges.jsx";
import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agent } = useAuth();
  const { addToast } = useToast();
  const { socket } = useSocket();
  const isAdmin = agent?.role === "admin";

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const [ticketRes, messagesRes] = await Promise.all([getTicket(id), getMessages(id)]);
      setTicket(ticketRes.data.ticket);
      // NOTE: this endpoint's response key is "message" (singular) but
      // holds an array — that's the backend's actual shape, not a bug here.
      setMessages(messagesRes.data.message || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError("Couldn't load this ticket.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;

    function handleTicketUpdated(updatedTicket) {
      if (Number(updatedTicket.id) === Number(id)) {
        setTicket((prev) => ({ ...prev, ...updatedTicket }));
        addToast("Ticket details updated in real time.");
      }
    }

    function handleTicketDeleted(data) {
      if (Number(data.id) === Number(id)) {
        addToast("This ticket was deleted.", "error");
        navigate("/tickets", { replace: true });
      }
    }

    function handleMessageCreated(reply) {
      if (Number(reply.ticket_id) === Number(id)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === reply.id)) return prev;
          return [...prev, reply];
        });
        addToast("New reply received.");
      }
    }

    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:deleted", handleTicketDeleted);
    socket.on("message:created", handleMessageCreated);

    return () => {
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:deleted", handleTicketDeleted);
      socket.off("message:created", handleMessageCreated);
    };
  }, [socket, id, navigate, addToast]);

  if (loading) return <div className="content"><Loading label="Loading ticket…" /></div>;
  if (notFound) return <div className="content"><p>Ticket not found.</p></div>;
  if (error) return <div className="content"><p className="error-text">{error}</p></div>;
  if (!ticket) return null;

  // Non-admin agents can only act on tickets assigned to them; the backend
  // enforces this too, so this is just to avoid showing controls that
  // would 404 anyway.
  const canManage = isAdmin || ticket.assigned_agent_id === agent?.id;

  return (
    <div className="content">
      <button className="btn" style={{ marginBottom: "var(--space-4)" }} onClick={() => navigate("/tickets")}>
        ← Back to tickets
      </button>

      <div className="panel" style={{ padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ marginBottom: "var(--space-2)" }}>{ticket.subject}</h1>
            <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-3)" }}>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
          {isAdmin && (
            <button className="btn" onClick={() => handleDelete(id, navigate, addToast)}>
              Delete
            </button>
          )}
        </div>

        <p style={{ marginBottom: "var(--space-4)" }}>{ticket.description}</p>

        <div className="mono" style={{ fontSize: 12, color: "var(--color-slate-muted)", display: "flex", gap: "var(--space-5)" }}>
          <span>Customer #{ticket.customer_id}</span>
          <span>Agent {ticket.assigned_agent_id ? `#${ticket.assigned_agent_id}` : "unassigned"}</span>
          <span>Created {formatDateTime(ticket.created_at)}</span>
          <span>Updated {formatDateTime(ticket.updated_at)}</span>
        </div>
      </div>

      {canManage && <TicketControls ticket={ticket} isAdmin={isAdmin} onUpdated={load} addToast={addToast} />}

      {/* Replying isn't gated by assignment on the backend — any agent in
          the company can reply to any ticket they can view. */}
      <ConversationPanel ticketId={id} messages={messages} canReply={true} onSent={load} addToast={addToast} />
    </div>
  );
}

async function handleDelete(id, navigate, addToast) {
  if (!window.confirm("Delete this ticket? This can't be undone.")) return;
  try {
    await deleteTicket(id);
    addToast("Ticket deleted.");
    navigate("/tickets", { replace: true });
  } catch (err) {
    addToast(err.response?.data?.message || "Couldn't delete this ticket.", "error");
  }
}

function TicketControls({ ticket, isAdmin, onUpdated, addToast }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [agents, setAgents] = useState([]);
  const [assignTo, setAssignTo] = useState(ticket.assigned_agent_id || "");
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setAssignTo(ticket.assigned_agent_id || "");
  }, [ticket.status, ticket.priority, ticket.assigned_agent_id]);

  useEffect(() => {
    if (isAdmin) {
      listAgents()
        .then((res) => setAgents(res.data.agents || []))
        .catch(() => {});
    }
  }, [isAdmin]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateTicket(ticket.id, { status, priority });
      addToast("Ticket updated.");
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update the ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    if (!assignTo) return;
    setError("");
    setAssigning(true);
    try {
      await assignTicket(ticket.id, Number(assignTo));
      addToast("Ticket assigned.");
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't assign the ticket.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
      <h2 style={{ marginBottom: "var(--space-4)" }}>Manage</h2>

      {error && <p className="error-text" style={{ marginBottom: "var(--space-3)" }}>{error}</p>}

      <form onSubmit={handleSave} style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-end", flexWrap: "wrap", marginBottom: isAdmin ? "var(--space-5)" : 0 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="ticket-status">Status</label>
          <select id="ticket-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="ticket-priority">Priority</label>
          <select id="ticket-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      {isAdmin && (
        <form onSubmit={handleAssign} style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
            <label htmlFor="assign-agent">Assign to</label>
            <select id="assign-agent" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              <option value="">Select an agent…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn" disabled={assigning || !assignTo}>
            {assigning ? "Assigning…" : "Assign"}
          </button>
        </form>
      )}
    </div>
  );
}

function ConversationPanel({ ticketId, messages, canReply, onSent, addToast }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    setSending(true);
    try {
      await replyToTicket(ticketId, text.trim());
      setText("");
      addToast("Reply sent.");
      onSent();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send the reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--space-5)" }}>
      <h2 style={{ marginBottom: "var(--space-4)" }}>Conversation</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--color-slate-muted)" }}>No replies yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ borderLeft: "2px solid var(--color-steel)", paddingLeft: "var(--space-3)" }}>
            <div className="mono" style={{ fontSize: 12, color: "var(--color-slate-muted)", marginBottom: "var(--space-1)" }}>
              Agent #{m.sender_agent_id} · {formatDateTime(m.created_at)}
            </div>
            <p>{m.messages}</p>
          </div>
        ))}
      </div>

      {canReply ? (
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
      ) : (
        <p style={{ color: "var(--color-slate-muted)", fontSize: 13 }}>
          Only the assigned agent or an admin can reply to this ticket.
        </p>
      )}
    </div>
  );
}
