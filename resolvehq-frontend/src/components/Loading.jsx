export default function Loading({ label = "Loading…" }) {
  return <p style={{ color: "var(--color-slate-muted)", padding: "var(--space-4)" }}>{label}</p>;
}
