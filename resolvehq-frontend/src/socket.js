
import { io } from "socket.io-client";

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:3000/api")
    .replace(/\/api\/?$/, "");

export const agentSocket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  auth: {
    sessionType: "agent",
  },
});

export const customerSocket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  auth: {
    sessionType: "customer",
  },
});

export function connectAgentSocket() {
  if (!agentSocket.connected) {
    agentSocket.connect();
  }
}

export function disconnectAgentSocket() {
  agentSocket.disconnect();
}

export function connectCustomerSocket() {
  if (!customerSocket.connected) {
    customerSocket.connect();
  }
}

export function disconnectCustomerSocket() {
  customerSocket.disconnect();
}
