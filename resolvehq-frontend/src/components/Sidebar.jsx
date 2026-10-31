
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sidebar({ open, onNavigate }) {
  const { agent } = useAuth();
  console.log("Logged-in agent:", agent);
  console.log("Agent role:", agent?.role);

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tickets", label: "Tickets" },
    { to: "/customers", label: "Customers" },

    // Admin-only navigation links
    ...(agent?.role === "admin"
      ? [
        { to: "/agents", label: "Agents" },
        { to: "/faqs", label: "FAQs" },
      ]
      : []),
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={onNavigate}
        />
      )}

      <aside className={`sidebar${open ? " open" : ""}`}>
        {/* Logo */}
        <Link
          to="/dashboard"
          onClick={onNavigate}
          style={{
            padding: "var(--space-5) var(--space-4)",
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
          }}
        >
          ResolveHQ
        </Link>

        {/* Navigation links */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-1)",
            padding: "0 var(--space-3)",
          }}
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              style={({ isActive }) => ({
                padding: "8px 12px",
                borderRadius: "var(--radius)",
                color: isActive
                  ? "#fff"
                  : "var(--color-steel-light)",
                background: isActive
                  ? "var(--color-ink-soft)"
                  : "transparent",
                textDecoration: "none",
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
