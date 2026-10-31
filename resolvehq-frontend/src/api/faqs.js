import api from "./axios";

export function listFaqs(params = {}) {
  return api.get("/faqs", { params });
}

export function createFaq(data) {
  return api.post("/faqs", data);
}

export function updateFaq(id, data) {
  return api.put(`/faqs/${id}`, data);
}

export function deleteFaq(id) {
  return api.delete(`/faqs/${id}`);
}