import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authApi from "../api/auth.js";
import { connectSocket, disconnectSocket } from "../socket.js";

const AuthContext = createContext(null);

// GET /api/auth/me now looks up the full agent record from the DB (not
// just the JWT payload), so name/email are available on every session
// check, not only right after login.

function normalizeFromMe(user) {
  return {
    id: user.agentId,
    companyId: user.companyId,
    role: user.role,
    name: user.name,
    email: user.email,
  };
}

function normalizeFromLogin(agent) {
  return {
    id: agent.id,
    companyId: agent.companyId,
    role: agent.role,
    name: agent.name,
    email: agent.email,
  };
}

export function AuthProvider({ children }) {
  const [agent, setAgent] = useState(null);
  const [status, setStatus] = useState("checking"); // checking | authenticated | unauthenticated

  const checkSession = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      const normalized = normalizeFromMe(res.data.user);
      setAgent(normalized);
      setStatus("authenticated");
      connectSocket(normalized.companyId);
    } catch {
      setAgent(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function login(credentials) {
    const res = await authApi.login(credentials);
    const normalized = normalizeFromLogin(res.data.agent);
    setAgent(normalized);
    setStatus("authenticated");
    connectSocket(normalized.companyId);
    return res.data;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setAgent(null);
      setStatus("unauthenticated");
      disconnectSocket();
    }
  }

  return (
    <AuthContext.Provider value={{ agent, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
