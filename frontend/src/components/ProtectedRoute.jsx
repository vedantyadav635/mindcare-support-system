/**
 * Guards a group of routes.
 *   - not logged in  -> /login (and back to the requested page after logging in)
 *   - wrong role     -> that role's own home page
 * <ProtectedRoute roles={["student"]}><AppLayout /></ProtectedRoute>
 */
import { Navigate, useLocation } from "react-router-dom";
import { ROLE_HOME } from "../config";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-500">
        <Spinner size="lg" label="Loading your account" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
}
