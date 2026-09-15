import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sidebar({ open, onNavigate }) {
  const { agent } = useAuth();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tickets", label: "Tickets" },
    { to: "/customers", label: "Customers" },
    // Agent management is admin-only on the backend (requiredRole("admin")).
    // Hiding it for non-admins is a UX nicety only — the backend still
    // enforces this regardless of what the frontend shows.
    ...(agent?.role === "admin" ? [{ to: "/agents", label: "Agents" }] : []),
  ];

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onNavigate} />}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div style={{ padding: "var(--space-5) var(--space-4)", fontWeight: 600, color: "#fff" }}>
          ResolveHQ
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", padding: "0 var(--space-3)" }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              style={({ isActive }) => ({
                padding: "8px 12px",
                borderRadius: "var(--radius)",
                color: isActive ? "#fff" : "var(--color-steel-light)",
                background: isActive ? "var(--color-ink-soft)" : "transparent",
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
