import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import Spinner from '../components/feedback/Spinner';

const ProtectedRoute = ({ children, allowedRoles, publicOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ marginTop: '5rem', textAlign: 'center' }}>
                <Spinner size="lg" />
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Verifying session...</p>
            </div>
        );
    }

    // Extract and normalize user role(s)
    const rawRole = user?.role || user?.roles || '';
    const userRolesList = Array.isArray(rawRole) 
        ? rawRole.map(r => String(r).toUpperCase().replace('ROLE_', ''))
        : [String(rawRole).toUpperCase().replace('ROLE_', '')];

    // 1. Handle Public Views: Allow public access, redirect internal roles to their dashboards
    if (publicOnly) {
        // Redirect internal roles to their dashboards (only if logged in)
        if (user && userRolesList.includes('AGENCY')) {
            return <Navigate to="/agency/dashboard" replace />;
        }
        if (user && userRolesList.includes('OWNER')) {
            return <Navigate to="/owner/dashboard" replace />;
        }
        if (user && userRolesList.includes('ADMIN')) {
            return <Navigate to="/admin/dashboard" replace />;
        }
        // Allow public visitors (not logged in) and customers to view public view
        return children;
    }

    // 2. For protected routes: Not logged in -> redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Verify role matching for protected routes
    const hasRole = !allowedRoles || allowedRoles.length === 0 || allowedRoles.some((role) => {
        const targetRole = String(role).toUpperCase().replace('ROLE_', '');
        return userRolesList.includes(targetRole);
    });

    if (!hasRole) {
        console.warn(`[ProtectedRoute] Access denied. User roles:`, userRolesList, `Allowed:`, allowedRoles);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;