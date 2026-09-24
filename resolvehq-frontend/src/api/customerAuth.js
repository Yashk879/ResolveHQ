import api from "./axios";

export function customerSignup({ companyId, name, email, password }) {
  return api.post("/customer-auth/signup", { companyId, name, email, password });
}

export function customerLogin({ companyId, email, password }) {
  return api.post("/customer-auth/login", { companyId, email, password });
}

export function customerLogout() {
  return api.post("/customer-auth/logout");
}

export function getCustomerMe() {
  return api.get("/customer-auth/me");
}
