import { useEffect, useState } from "react";
import { listAgents, createAgent, updateAgent } from "../api/agents.js";
import Loading from "../components/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listAgents();
      setAgents(res.data.agents || []);
    } catch (err) {
      setError("Couldn't load agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
        <h1>Agents</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "Add agent"}
        </button>
      </div>

      {showCreate && (
        <CreateAgentPanel
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {loading && <Loading label="Loading agents…" />}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="panel" style={{ padding: "var(--space-5)" }}>
          {agents.length === 0 ? (
            <p style={{ color: "var(--color-slate-muted)" }}>No agents yet.</p>
          ) : (
            <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) =>
                  editingId === a.id ? (
                    <EditAgentRow
                      key={a.id}
                      agent={a}
                      onCancel={() => setEditingId(null)}
                      onSaved={() => {
                        setEditingId(null);
                        load();
                      }}
                    />
                  ) : (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>{a.email}</td>
                      <td style={{ textTransform: "capitalize" }}>{a.role}</td>
                      <td className="mono">{formatDate(a.created_at)}</td>
                      <td>
                        <button className="btn" onClick={() => setEditingId(a.id)}>Edit</button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditAgentRow({ agent, onCancel, onSaved }) {
  const { addToast } = useToast();
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await updateAgent(agent.id, { name, role });
      addToast("Agent updated.");
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update this agent.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
      </td>
      <td>{agent.email}</td>
      <td>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="agent">agent</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td className="mono">{formatDate(agent.created_at)}</td>
      <td>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
        </div>
        {error && <p className="error-text" style={{ marginTop: "var(--space-1)" }}>{error}</p>}
      </td>
    </tr>
  );
}

function CreateAgentPanel({ onCreated }) {
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createAgent({ name, email, password });
      addToast("Agent added.");
      onCreated();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setError(err.response?.data?.message || "An agent with this email already exists.");
      } else {
        setError(err.response?.data?.message || "Couldn't add this agent.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
      <h2 style={{ marginBottom: "var(--space-1)" }}>Add agent</h2>
      <p style={{ color: "var(--color-slate-muted)", marginBottom: "var(--space-4)" }}>
        New agents are created with the "agent" role — change it after creation if needed.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="agent-name">Name</label>
          <input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="agent-email">Email</label>
          <input id="agent-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="agent-password">Temporary password</label>
          <input id="agent-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="error-text" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Adding…" : "Add agent"}
        </button>
      </form>
    </div>
  );
}
