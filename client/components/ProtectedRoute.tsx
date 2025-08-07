import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/NewAuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole[];
  requireAdmin?: boolean; // Legacy support
}

export default function ProtectedRoute({ 
  children, 
  requireRole,
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Legacy admin check
  if (requireAdmin && !['superuser', 'enterprise_manager'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based access control
  if (requireRole && !requireRole.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
