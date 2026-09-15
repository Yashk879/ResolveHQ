import api from "./axios";

// params can include: page, limit, status, priority, search
export function listTickets(params = {}) {
  return api.get("/tickets", { params });
}

export function getTicket(id) {
  return api.get(`/tickets/${id}`);
}

export function createTicket(data) {
  return api.post("/tickets/createTickets", data);
}

export function updateTicket(id, data) {
  return api.patch(`/tickets/${id}`, data);
}

export function assignTicket(id, agentId) {
  return api.patch(`/tickets/${id}/assign`, { agentId });
}

export function deleteTicket(id) {
  return api.delete(`/tickets/${id}`);
}
