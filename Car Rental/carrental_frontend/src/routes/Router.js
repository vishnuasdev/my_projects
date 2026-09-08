import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Spinner from '../components/feedback/Spinner';
import { useAuth } from '../features/auth/hooks/useAuth';

// Auth Components
const LoginForm = lazy(() => import('../features/auth/components/LoginForm'));
const RegisterForm = lazy(() => import('../features/auth/components/RegisterForm'));
const ProfileView = lazy(() => import('../features/auth/components/ProfileView'));

// Views & Dashboards
const PublicView = lazy(() => import('../features/dashboard/PublicView'));
const CustomerDashboard = lazy(() => import('../features/dashboard/CustomerView'));
const AgencyDashboard = lazy(() => import('../features/dashboard/AgencyView'));
const OwnerDashboard = lazy(() => import('../features/dashboard/OwnerView'));
const AdminDashboard = lazy(() => import('../features/dashboard/AdminView'));

const getDashboardPath = (role) => {
  switch (String(role || '').toUpperCase()) {
    case 'AGENCY':
      return '/agency/dashboard';
    case 'OWNER':
      return '/owner/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/customer/dashboard';
  }
};

const HomeRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to={getDashboardPath(user.role)} replace /> : <PublicView />;
};

const Router = () => {
  return (
    <Suspense fallback={<div style={{ paddingTop: '4rem', textAlign: 'center' }}><Spinner size="lg" /></div>}>
      <Routes>
        {/* Public Home Route */}
        <Route path="/" element={<HomeRoute />} />

        {/* Guest-Only Auth Routes */}
        <Route element={<ProtectedRoute publicOnly />}>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
        </Route>
        <Route element={<ProtectedRoute allowAuthenticated />}>
          <Route path="/login/add" element={<LoginForm allowAuthenticated />} />
        </Route>

        {/* Global Shared Profile */}
        <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'AGENCY', 'OWNER', 'ADMIN']} />}>
          <Route path="/profile" element={<ProfileView />} />
        </Route>

        {/* Role-Specific Guard Groups */}
        <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/profile" element={<ProfileView />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['AGENCY']} />}>
          <Route path="/agency/dashboard" element={<AgencyDashboard />} />
          <Route path="/agency/profile" element={<ProfileView />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/profile" element={<ProfileView />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/profile" element={<ProfileView />} />
        </Route>

        {/* Catch-All Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default Router;