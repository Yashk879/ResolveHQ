import api from "./axios";

// Admin-only: totals across the whole company.
export function getAdminStats() {
  return api.get("/stats/stats");
}

// Agent-only: totals for tickets assigned to the current agent.
// Note: the backend's requiredRole("agent") check is exact-match, so an
// admin calling this gets a 403 — there's no "my stats" view for admins.
export function getAgentStats() {
  return api.get("/stats/agentStats");
}
