import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(formData);
            const role = user.role ? user.role.toUpperCase() : '';

            if (role.includes('CUSTOMER')) navigate('/customer/dashboard');
            else if (role.includes('AGENCY')) navigate('/agency/dashboard');
            else if (role.includes('OWNER')) navigate('/owner/dashboard');
            else if (role.includes('ADMIN')) navigate('/admin/dashboard');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <h2>Sign In</h2>
            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

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

                <button type="submit" className="btn btn-primary btn-md" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
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