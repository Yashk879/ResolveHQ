import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  {
    icon: "🎫",
    title: "One queue, every ticket",
    text: "Every customer issue lands in a single, filterable queue — searchable by status, priority, or subject.",
  },
  {
    icon: "🏢",
    title: "Built for multiple teams",
    text: "Each company's tickets, customers, and agents are fully isolated — your data never mixes with anyone else's.",
  },
  {
    icon: "⚡",
    title: "Fast triage",
    text: "Assign, reprioritize, and reply without leaving the ticket — status changes reflect immediately for the whole team.",
  },
];

export default function Home() {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <div>
      <div className="hero-bg">
        <nav className="home-nav">
          <span className="brand">ResolveHQ</span>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-ghost">Go to dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Agent login</Link>
                <Link to="/signup" className="btn btn-primary">Create workspace</Link>
              </>
            )}
          </div>
        </nav>

        <div className="home-hero">
          <h1>Customer support, without the chaos.</h1>
          <p>
           ResolveHQ is a multi-tenant customer support platform built for businesses to 
           streamline ticket management, customer communication, and support operations 
            through a centralized, role-based system.
          </p>
          <div className="cta-row">
            <Link to="/login" className="btn btn-primary btn-lg">Raise a ticket</Link>
            <Link to="/signup" className="btn btn-ghost btn-lg">Start a workspace</Link>
          </div>
        </div>
      </div>

      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="panel feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>

      <footer className="home-footer">
        ResolveHQ — built for teams who'd rather fix things than manage a tool.
      </footer>
    </div>
  );
}
