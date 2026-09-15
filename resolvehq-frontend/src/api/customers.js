import api from "./axios";

export function listCustomers(params = {}) {
  return api.get("/customer", { params });
}

export function getCustomer(id) {
  return api.get(`/customer/${id}`);
}

export function createCustomer(data) {
  return api.post("/customer/create", data);
}

// Backend doesn't have this endpoint yet — added here so Phase 6 (or later)
// just works once it exists. Calling it now will 404 until then.
export function getCustomerTickets(id) {
  return api.get(`/customer/${id}/tickets`);
}
