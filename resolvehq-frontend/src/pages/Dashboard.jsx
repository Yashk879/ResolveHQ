import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { getAdminStats, getAgentStats } from "../api/stats.js";
import { listTickets } from "../api/tickets.js";
import TicketList from "../components/TicketList.jsx";
import Loading from "../components/Loading.jsx";

const STAT_FIELDS = [
  { key: "totalTickets", label: "Total", dot: null },
  { key: "open", label: "Open", dot: "open" },
  { key: "inProgress", label: "In progress", dot: "in_progress" },
  { key: "resolved", label: "Resolved", dot: "resolved" },
  { key: "closed", label: "Closed", dot: "closed" },
];

export default function Dashboard() {
  const { agent } = useAuth();
  const { socket } = useSocket();
  const isAdmin = agent?.role === "admin";

  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError("");
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        isAdmin ? getAdminStats() : getAgentStats(),
        listTickets({ limit: 5, page: 1 }),
      ]);
      setStats(statsRes.data);
      setRecentTickets(ticketsRes.data.tickets || []);
    } catch (err) {
      if (!isBackground) setError("Couldn't load dashboard data. Please try refreshing.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;

    function handleRealtimeUpdate() {
      // Reload in background without unmounting/flashing loading spinner
      load(true);
    }

    socket.on("ticket:created", handleRealtimeUpdate);
    socket.on("ticket:updated", handleRealtimeUpdate);
    socket.on("ticket:deleted", handleRealtimeUpdate);

    return () => {
      socket.off("ticket:created", handleRealtimeUpdate);
      socket.off("ticket:updated", handleRealtimeUpdate);
      socket.off("ticket:deleted", handleRealtimeUpdate);
    };
  }, [socket, load]);


  return (
    <div className="content">
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1>{agent?.name ? `Welcome back, ${agent.name}` : "Welcome back"}</h1>
        <p style={{ color: "var(--color-slate-muted)", marginTop: "var(--space-1)" }}>
          {isAdmin ? "Here's how your company's tickets are looking." : "Here's what's assigned to you."}
        </p>
      </div>

      {loading && <Loading label="Loading dashboard…" />}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          <div
            className="panel stat-strip"
            style={{
              display: "flex",
              padding: "var(--space-5)",
              marginBottom: "var(--space-5)",
              gap: "var(--space-7)",
            }}
          >
            {STAT_FIELDS.map((field) => (
              <div key={field.key}>
                <div style={{ fontSize: 12, color: "var(--color-slate-muted)", marginBottom: "var(--space-1)" }}>
                  {field.dot && <span className={`dot dot-${field.dot}`} />}
                  {field.label}
                </div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: "var(--color-ink)" }}>
                  {stats?.[field.key] ?? "—"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <Link to="/tickets" className="btn btn-primary">View all tickets</Link>
            <Link to="/customers" className="btn">Add customer</Link>
            {isAdmin && <Link to="/agents" className="btn">Manage agents</Link>}
          </div>

          <div className="panel" style={{ padding: "var(--space-5)" }}>
            <h2 style={{ marginBottom: "var(--space-4)" }}>Recent tickets</h2>
            <TicketList tickets={recentTickets} emptyMessage="No tickets yet." />
          </div>
        </>
      )}
    </div>
  );
}
