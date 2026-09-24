import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as customerAuthApi from "../api/customerAuth.js";

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [status, setStatus] = useState("checking"); // checking | authenticated | unauthenticated

  const checkSession = useCallback(async () => {
    try {
      const res = await customerAuthApi.getCustomerMe();
      setCustomer(res.data.customer);
      setStatus("authenticated");
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
    setCustomer(res.data.customer);
    setStatus("authenticated");
    return res.data;
  }

  async function logout() {
    try {
      await customerAuthApi.customerLogout();
    } finally {
      setCustomer(null);
      setStatus("unauthenticated");
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
