import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loading from "./Loading.jsx";

// requiredRole is a UX nicety only — the backend's requiredRole()
// middleware is the actual enforcement. This just avoids showing an
// admin-only page (that would 403 on every API call anyway) to an agent.
export default function ProtectedRoute({ children, requiredRole }) {
  const { status, agent } = useAuth();

  if (status === "checking") {
    return <Loading label="Checking session…" />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && agent?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
