import { Navigate } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import Loading from "./Loading.jsx";

export default function CustomerProtectedRoute({ children }) {
  const { status } = useCustomerAuth();

  if (status === "checking") {
    return <Loading label="Checking session…" />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/customer/login" replace />;
  }

  return children;
}
