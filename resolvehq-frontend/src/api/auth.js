import api from "./axios";

export function signup({ companyName, name, email, password }) {
  return api.post("/auth/signup", { companyName, name, email, password });
}

export function login({ email, password }) {
  return api.post("/auth/login", { email, password });
}

export function logout() {
  return api.post("/auth/logout");
}

export function getMe() {
  return api.get("/auth/me");
}

export function forgotPassword(email) {
  return api.post("/auth/forgotPassword", { email });
}

export function resetPassword({ token, newPassword }) {
  return api.post("/auth/resetPassword", { token, newPassword });
}
