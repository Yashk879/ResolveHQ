import { useNavigate } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "./Badges.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// NOTE: the backend's ticket rows only carry customer_id / assigned_agent_id
// (no joined name), so that's what we show. Wire up a name lookup later if
// the backend starts returning one.
export default function TicketList({ tickets, emptyMessage = "No tickets found." }) {
  const navigate = useNavigate();

  if (!tickets || tickets.length === 0) {
    return <p style={{ color: "var(--color-slate-muted)", padding: "var(--space-4) 0" }}>{emptyMessage}</p>;
  }

  return (
    <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Customer</th>
          <th>Agent</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr
            key={ticket.id}
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            style={{ cursor: "pointer" }}
          >
            <td>{ticket.subject}</td>
            <td className="mono">#{ticket.customer_id}</td>
            <td className="mono">{ticket.assigned_agent_id ? `#${ticket.assigned_agent_id}` : "Unassigned"}</td>
            <td><StatusBadge status={ticket.status} /></td>
            <td><PriorityBadge priority={ticket.priority} /></td>
            <td className="mono">{formatDate(ticket.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
