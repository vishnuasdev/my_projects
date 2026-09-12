import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import Spinner from '../components/feedback/Spinner';

const ProtectedRoute = ({ allowedRoles, publicOnly = false, allowAuthenticated = false, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Normalize role string to uppercase (handles AGENCY, ADMIN, OWNER, CUSTOMER)
  const rawRole = user?.role || user?.roles || user?.authorities;
  const userRoleValue = Array.isArray(rawRole)
    ? (rawRole[0]?.authority || rawRole[0])
    : (rawRole?.authority || rawRole);
  const userRole = userRoleValue
    ? String(userRoleValue).toUpperCase().replace(/^ROLE_/, '')
    : null;

  // Map normalized roles to default dashboards
  const getDashboardPath = (role) => {
    switch (role) {
      case 'AGENCY':
        return '/agency/dashboard';
      case 'OWNER':
        return '/owner/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      case 'CUSTOMER':
      default:
        return '/customer/dashboard';
    }
  };

  // 1. Logged-in user trying to access public-only routes (e.g., /login or /register)
  if (publicOnly && user && !allowAuthenticated) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  // 2. Unauthenticated user trying to access protected routes
  if (!publicOnly && !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Authenticated user trying to access routes not allowed for their role
  if (!publicOnly && allowedRoles) {
    if (!userRole) {
      return <Navigate to="/login" replace />;
    }

    const normalizedAllowedRoles = allowedRoles.map((r) =>
      String(r).toUpperCase().replace(/^ROLE_/, '')
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      return <Navigate to={getDashboardPath(userRole)} replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;