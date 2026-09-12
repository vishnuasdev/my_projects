import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { normalizeRole } from '../../../providers/AuthProvider';
import { useAuth } from '../hooks/useAuth';

const LoginForm = ({ allowAuthenticated = false }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [statusError, setStatusError] = useState({ message: '', status: '' });
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusError({ message: '', status: '' });
        setIsLoading(true);

        try {
            const loginResult = await login(formData);
            const user = normalizeRole(loginResult.user || loginResult);

            // Double check status before navigating
            const currentStatus = user.status ? user.status.toUpperCase() : '';
            if (currentStatus && currentStatus !== 'ACTIVE') {
                setStatusError({
                    message: `Account is ${currentStatus}. Dashboard access is restricted.`,
                    status: currentStatus
                });
                return;
            }

            // Route user based on role for ACTIVE accounts
            const role = String(user.role || '').toUpperCase().replace(/^ROLE_/, '');

            if (role.includes('CUSTOMER')) navigate('/customer/dashboard');
            else if (role.includes('AGENCY')) navigate('/agency/dashboard');
            else if (role.includes('OWNER')) navigate('/owner/dashboard');
            else if (role.includes('ADMIN')) navigate('/admin/dashboard');
            else navigate('/');
        } catch (err) {
            if (err.response && err.response.data) {
                const data = err.response.data;
                setStatusError({
                    message: data.message || 'Invalid email or password.',
                    status: data.status || ''
                });
            } else {
                setStatusError({
                    message: err.message || 'Unable to connect to the server. Please try again.',
                    status: ''
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
          <section className="auth-card">
            <header className="auth-card__header">
                <p className="auth-card__eyebrow">Car Rental</p>
                <h1>{allowAuthenticated || location.pathname === '/login/add' ? 'Add account' : 'Welcome back'}</h1>
                <p className="auth-card__subtitle">
                    {allowAuthenticated || location.pathname === '/login/add'
                        ? 'Add another account to this browser.'
                        : 'Sign in to manage your rentals and account.'}
                </p>
            </header>

            {statusError.message && (
                <div className="auth-card__alert" role="alert" aria-live="assertive">
                    {statusError.status && (
                        <p>
                            Status: {statusError.status}
                        </p>
                    )}
                    <p>{statusError.message}</p>
                </div>
            )}

            <form className="auth-card__form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                        type="email"
                        name="email"
                        className="form-input"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                        type="password"
                        name="password"
                        className="form-input"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="btn btn-primary btn-md auth-card__button"
                >
                    {isLoading ? 'Signing in...' : 'Log In'}
                </button>
            </form>

            <p className="auth-card__footer">
                Don't have an account? <Link to="/register">Register</Link>
            </p>
          </section>
        </div>
    );
};

export default LoginForm;