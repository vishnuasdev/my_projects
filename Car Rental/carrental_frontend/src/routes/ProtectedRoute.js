import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import Spinner from '../components/feedback/Spinner';

const ProtectedRoute = ({ allowedRoles, publicOnly = false, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Normalize role string to uppercase
  const userRole = user?.role ? user.role.toUpperCase() : null;

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

  // 1. Logged-in user trying to access public-only routes (login/register)
  if (publicOnly && user) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  // 2. Unauthenticated user trying to access protected routes
  if (!publicOnly && !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. User logged in, but role is missing or not allowed
  if (allowedRoles && userRole) {
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return <Navigate to={getDashboardPath(userRole)} replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;