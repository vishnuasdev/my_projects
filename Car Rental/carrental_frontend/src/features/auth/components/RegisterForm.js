import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CUSTOMER',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.name.trim()) return 'Please enter your full name.';
        if (!formData.email.trim()) return 'Please enter your email address.';
        if (formData.password.length < 6) return 'Password must be at least 6 characters long.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            await register(formData);
            navigate('/login');
        } catch (err) {
            setError(
                err.response?.data?.message || 
                err.message || 
                'Registration failed. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <h2>Create an Account</h2>
            
            {error && (
                <div 
                    role="alert"
                    aria-live="assertive"
                    style={{ 
                        color: 'var(--danger, #dc3545)', 
                        backgroundColor: 'rgba(220, 53, 69, 0.1)', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '0.375rem', 
                        marginBottom: '1rem', 
                        fontSize: '0.875rem' 
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name *</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address *</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className="form-input"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password *</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted, #6c757d)'
                            }}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="role" className="form-label">Account Type</label>
                    <select
                        id="role"
                        name="role"
                        className="form-select"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={isLoading}
                    >
                        <option value="CUSTOMER">Customer (Rent a Car)</option>
                        <option value="AGENCY">Rental Agency (Manage Fleet)</option>
                        <option value="OWNER">Vehicle Owner (Host a Car)</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-md"
                    disabled={isLoading}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                >
                    {isLoading ? 'Creating Account...' : 'Register'}
                </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
                    Log In
                </Link>
            </p>
        </div>
    );
};

export default RegisterForm;