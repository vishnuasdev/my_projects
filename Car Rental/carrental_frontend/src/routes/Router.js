import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Spinner from '../components/feedback/Spinner';

const LoginForm = lazy(() => import('../features/auth/components/LoginForm'));
const RegisterForm = lazy(() => import('../features/auth/components/RegisterForm'));

// Public View
const PublicView = lazy(() => import('../features/dashboard/PublicView'));

// Dashboards
const CustomerDashboard = lazy(() => import('../features/dashboard/CustomerView'));
const AgencyDashboard = lazy(() => import('../features/dashboard/AgencyView'));
const OwnerDashboard = lazy(() => import('../features/dashboard/OwnerView'));
const AdminDashboard = lazy(() => import('../features/dashboard/AdminView'));

// Profile View Component
const ProfileView = lazy(() => import('../features/auth/components/ProfileView'));

const Router = () => {
    return (
        <Suspense fallback={<div style={{ paddingTop: '4rem' }}><Spinner size="lg" /></div>}>
            <Routes>
                {/* Public Home Page - Protected to redirect non-customers to their dashboards */}
                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute publicOnly>
                            <PublicView />
                        </ProtectedRoute>
                    } 
                />

                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />

                {/* Single General Profile Route */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute allowedRoles={['CUSTOMER', 'AGENCY', 'OWNER', 'ADMIN']}>
                            <ProfileView />
                        </ProtectedRoute>
                    }
                />

                {/* Role Specific Dashboards */}
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

                {/* Role-Specific Profile Aliases */}
                <Route
                    path="/customer/profile"
                    element={
                        <ProtectedRoute allowedRoles={['CUSTOMER']}>
                            <ProfileView />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/agency/profile"
                    element={
                        <ProtectedRoute allowedRoles={['AGENCY']}>
                            <ProfileView />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/owner/profile"
                    element={
                        <ProtectedRoute allowedRoles={['OWNER']}>
                            <ProfileView />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/profile"
                    element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <ProfileView />
                        </ProtectedRoute>
                    }
                />

                {/* Catch-All Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default Router;