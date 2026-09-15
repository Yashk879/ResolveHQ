import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authApi from "../api/auth.js";

const AuthContext = createContext(null);

// NOTE on a backend quirk: GET /api/auth/me only returns the raw JWT
// payload — { agentId, companyId, role } — it does NOT include name or
// email. So on a fresh page load (no login just happened in this tab),
// we only know the agent's id/companyId/role, not their name/email.
// Full profile info (name, email) is only available right after a
// successful login response, so components should tolerate `name`/
// `email` being undefined until then.

function normalizeFromMe(user) {
  return {
    id: user.agentId,
    companyId: user.companyId,
    role: user.role,
    name: undefined,
    email: undefined,
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
      setAgent(normalizeFromMe(res.data.user));
      setStatus("authenticated");
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
    setAgent(normalizeFromLogin(res.data.agent));
    setStatus("authenticated");
    return res.data;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setAgent(null);
      setStatus("unauthenticated");
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
