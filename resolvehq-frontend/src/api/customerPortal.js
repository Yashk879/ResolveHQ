import api from "./axios";

export function createOwnTicket({ subject, description, priority }) {
  return api.post("/customer-portal/tickets", { subject, description, priority });
}

export function listOwnTickets() {
  return api.get("/customer-portal/tickets");
}

export function getOwnTicket(id) {
  return api.get(`/customer-portal/tickets/${id}`);
}

export function getOwnTicketMessages(id) {
  return api.get(`/customer-portal/tickets/${id}/messages`);
}

export function replyToOwnTicket(id, message) {
  return api.post(`/customer-portal/tickets/${id}/reply`, { message });
}
