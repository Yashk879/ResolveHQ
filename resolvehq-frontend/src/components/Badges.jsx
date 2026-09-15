// Status/priority shown as a small colored dot + label (see index.css
// .dot-* classes) rather than a glossy pill badge — matches the ops-tool
// direction rather than the generic SaaS-card look.

export function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className="status-label">
      <span className={`dot dot-${status}`} />
      {status.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span className="priority-label">
      <span className={`dot dot-${priority}`} />
      {priority}
    </span>
  );
}
