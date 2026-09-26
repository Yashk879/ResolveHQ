import { io } from "socket.io-client";

// VITE_API_URL is like "http://localhost:3000/api" — Socket.io connects
// to the server root, not the /api prefix, so strip it off.
const SOCKET_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");

// One shared connection for the whole app. autoConnect is off — we only
// connect once someone (agent or customer) is actually authenticated,
// via connectSocket() below, and disconnect on logout.
export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

export function connectSocket(companyId) {
  if (!socket.connected) {
    socket.connect();
  }
  // Explicit join, rather than relying only on the server's cookie-based
  // auto-join — this works the same way for both agent and customer
  // sessions, since the server only auto-detects the agent's "token"
  // cookie, not the customer's separate "customer_token" cookie.
  if (companyId) {
    socket.emit("join:company", companyId);
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
