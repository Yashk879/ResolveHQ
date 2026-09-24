import axios from "axios";

// Backend uses an httpOnly cookie for auth (see login/logout), so every
// request must go with credentials. Never store the JWT in localStorage.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Session cookies expire. If any call comes back 401 outside of a login
// attempt or a session-check itself, treat it as "session ended" and send
// the person back to the right login page rather than leaving them
// looking at a broken page.
//
// Pages meant to be visited while logged OUT (login, signup, password
// reset, and their customer-facing equivalents) are excluded here —
// otherwise the /me check that each AuthContext runs on every page load
// would 401 on these pages and force-redirect away before the person can
// use them.
//
// There are TWO independent auth systems (agent and customer), both
// mounted globally, each polling its own /me endpoint on every page load.
// An agent visiting /dashboard will always get a 401 from the customer's
// /customer-auth/me check (they aren't a customer) — that must NOT be
// treated as "the agent's session ended," or it would force-redirect a
// perfectly logged-in agent out of their own dashboard. So the two /me
// (session-probe) calls are always excluded from triggering a redirect;
// only a 401 on an actual protected-resource call (tickets, customers,
// etc.) means "this particular session actually ended."
const PUBLIC_PATHS = [
  "/", "/login", "/signup", "/forgot-password", "/reset-password",
  "/customer/login", "/customer/signup",
];

function isSessionProbeOrLoginCall(url = "") {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/me") ||
    url.includes("/customer-auth/login") ||
    url.includes("/customer-auth/me")
  );
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const onPublicPath = PUBLIC_PATHS.includes(window.location.pathname);

    if (error.response?.status === 401 && !isSessionProbeOrLoginCall(url) && !onPublicPath) {
      // Which login page depends on whose session actually ended.
      const isCustomerCall = url.includes("/customer-portal") || url.includes("/customer-auth");
      window.location.href = isCustomerCall ? "/customer/login" : "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
