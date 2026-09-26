import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as customerAuthApi from "../api/customerAuth.js";
import { connectSocket, disconnectSocket } from "../socket.js";

const CustomerAuthContext = createContext(null);

// getCustomerMe returns the raw DB row (company_id, snake_case);
// customerLogin returns companyId (camelCase). Normalize both to the
// same shape so the rest of the app never has to care which one ran.
function normalize(customer) {
  return {
    id: customer.id,
    companyId: customer.companyId ?? customer.company_id,
    name: customer.name,
    email: customer.email,
  };
}

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [status, setStatus] = useState("checking"); // checking | authenticated | unauthenticated

  const checkSession = useCallback(async () => {
    try {
      const res = await customerAuthApi.getCustomerMe();
      const normalized = normalize(res.data.customer);
      setCustomer(normalized);
      setStatus("authenticated");
      connectSocket(normalized.companyId);
    } catch {
      setCustomer(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function login(credentials) {
    const res = await customerAuthApi.customerLogin(credentials);
    const normalized = normalize(res.data.customer);
    setCustomer(normalized);
    setStatus("authenticated");
    connectSocket(normalized.companyId);
    return res.data;
  }

  async function logout() {
    try {
      await customerAuthApi.customerLogout();
    } finally {
      setCustomer(null);
      setStatus("unauthenticated");
      disconnectSocket();
    }
  }

  return (
    <CustomerAuthContext.Provider value={{ customer, status, login, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used inside a CustomerAuthProvider");
  return ctx;
}
