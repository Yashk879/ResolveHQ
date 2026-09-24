import api from "./axios";

export function createOwnTicket({ subject, description, priority }) {
  return api.post("/customer-portal/tickets", { subject, description, priority });
}

export function listOwnTickets() {
  return api.get("/customer-portal/tickets");
}
