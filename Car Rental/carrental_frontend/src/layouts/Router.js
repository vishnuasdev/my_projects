import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../routes/ProtectedRoute';
import Spinner from '../components/feedback/Spinner';

// Lazy-loaded Feature Components
const LoginForm = lazy(() => import('../features/auth/components/LoginForm'));
const RegisterForm = lazy(() => import('../features/auth/components/RegisterForm'));
const ProfileView = lazy(() => import('../features/auth/components/ProfileView'));

// Dashboards
const PublicView = lazy(() => import('../features/dashboard/PublicView'));
const CustomerDashboard = lazy(() => import('../features/dashboard/CustomerView'));
const AgencyDashboard = lazy(() => import('../features/dashboard/AgencyView'));
const OwnerDashboard = lazy(() => import('../features/dashboard/OwnerView'));
const AdminDashboard = lazy(() => import('../features/dashboard/AdminView'));

// Fallback Spinner
const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <Spinner size="lg" />
    </div>
);

const Router = () => {
    const ALL_ROLES = ['CUSTOMER', 'AGENCY', 'OWNER', 'ADMIN'];

    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Public Home Page */}
                <Route
                    path="/"
                    element={<PublicView />}
                />

                {/* Public Auth Routes (Restricted for logged-in users) */}
                <Route
                    path="/login"
                    element={
                        <ProtectedRoute publicOnly>
                            <LoginForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <ProtectedRoute publicOnly>
                            <RegisterForm />
                        </ProtectedRoute>
                    }
                />

                {/* Universal Profile Route */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute allowedRoles={ALL_ROLES}>
                            <ProfileView />
                        </ProtectedRoute>
                    }
                />

                {/* Role-Specific Dashboard Routes */}
                <Route
                    path="/customer/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['CUSTOMER']}>
                            <CustomerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/agency/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['AGENCY']}>
                            <AgencyDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/owner/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['OWNER']}>
                            <OwnerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Consolidated Profile Redirects */}
                {['/customer/profile', '/agency/profile', '/owner/profile', '/admin/profile'].map((path) => (
                    <Route
                        key={path}
                        path={path}
                        element={<Navigate to="/profile" replace />}
                    />
                ))}

                {/* Fallback Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default Router;