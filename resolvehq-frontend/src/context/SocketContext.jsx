import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export function SocketProvider({ children }) {
  const { agent, status } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if the user is authenticated
    if (status !== "authenticated" || !agent) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      query: {
        companyId: agent.companyId,
      },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Socket.io connected:", socketInstance.id);
      setIsConnected(true);
      if (agent.companyId) {
        socketInstance.emit("join:company", agent.companyId);
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket.io disconnected");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [status, agent?.companyId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
