import api from "./axios";

export function listCompanies() {
  return api.get("/companies");
}
