import api from "./axios";

// Admin-only on the backend.
export function listAgents() {
  return api.get("/agents/allAgents");
}

export function createAgent(data) {
  return api.post("/agents/createAgent", data);
}

export function updateAgent(id, data) {
  return api.patch(`/agents/${id}`, data);
}
