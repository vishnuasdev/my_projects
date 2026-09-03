import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [statusError, setStatusError] = useState({ message: '', status: '' });
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusError({ message: '', status: '' });
        setIsLoading(true);

        try {
            const user = await login(formData);

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
            const role = user.role ? user.role.toUpperCase() : '';

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
                    message: 'Unable to connect to the server. Please try again.',
                    status: ''
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <h2>Sign In</h2>

            {statusError.message && (
                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--danger, #ef4444)',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                }}>
                    {statusError.status && (
                        <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', color: 'var(--danger, #ef4444)' }}>
                            Status: {statusError.status}
                        </p>
                    )}
                    <p style={{ margin: 0, color: 'var(--danger, #ef4444)' }}>{statusError.message}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                        type="email"
                        name="email"
                        className="form-input"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
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
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary btn-md" 
                    disabled={isLoading} 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                >
                    {isLoading ? 'Signing in...' : 'Log In'}
                </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Register</Link>
            </p>
        </div>
    );
};

export default LoginForm;