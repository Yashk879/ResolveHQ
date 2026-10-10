
import axios from "axios";

// Local development fallback.
// In production, set VITE_API_URL to your deployed backend URL.
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Backend authentication uses httpOnly cookies.
// Send cookies with API requests.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Pages accessible without authentication.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/customer/login",
  "/customer/signup",
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
    const onPublicPath = PUBLIC_PATHS.includes(
      window.location.pathname
    );

    if (
      error.response?.status === 401 &&
      !isSessionProbeOrLoginCall(url) &&
      !onPublicPath
    ) {
      // Redirect to the relevant login page when a protected
      // API request indicates that the session has expired.
      const isCustomerCall =
        url.includes("/customer-portal") ||
        url.includes("/customer-auth");

      window.location.href = isCustomerCall
        ? "/customer/login"
        : "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
