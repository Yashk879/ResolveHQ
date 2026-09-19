import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Navbar({ onMenuClick }) {
  const { agent, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      addToast("Logged out.");
    } finally {
      navigate("/login", { replace: true });
    }
  }

  // agent.name is only known right after a fresh login in this tab (see
  // AuthContext for why /me alone can't supply it) — fall back to role.
  const label = agent?.name || (agent?.role ? `Signed in (${agent.role})` : "");

  return (
    <header className="topbar">
      <button className="menu-toggle btn" onClick={onMenuClick} aria-label="Open menu">
        ☰
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginLeft: "auto" }}>
        <span style={{ color: "var(--color-slate-muted)", fontSize: 13 }}>{label}</span>
        <button className="btn" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </header>
  );
}
