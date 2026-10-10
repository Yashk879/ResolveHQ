
import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
