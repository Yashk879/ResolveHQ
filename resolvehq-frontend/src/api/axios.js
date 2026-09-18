import axios from "axios";

// Backend uses an httpOnly cookie for auth (see login/logout), so every
// request must go with credentials. Never store the JWT in localStorage.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Session cookies expire (1 day). If any call comes back 401 outside of the
// login attempt itself, treat it as "session ended" and send the person
// back to /login rather than leaving them looking at a broken page.
//
// Pages that are meant to be visited while logged OUT (login, signup, and
// the password reset flow) must be excluded here — otherwise the /me
// check that AuthContext runs on every page load would 401 on these pages
// and force-redirect away before the person can use them.
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes("/auth/login");
    const onPublicPath = PUBLIC_PATHS.includes(window.location.pathname);
    if (error.response?.status === 401 && !isLoginCall && !onPublicPath) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
