import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        role: 'CUSTOMER',
        password: '',
        confirmPassword: '',
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
        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();
        if (name.length < 2) return 'Please enter your full name.';
        if (name.length > 100) return 'Your name must be 100 characters or fewer.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
        if (formData.phoneNumber && !/^\+?[0-9][0-9\s-]{6,28}$/.test(formData.phoneNumber.trim())) {
            return 'Please enter a valid mobile number.';
        }
        const passwordRule = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
        if (!passwordRule.test(formData.password)) return 'Password must be 8-72 characters and include both letters and numbers.';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
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
            const { confirmPassword, ...registrationData } = formData;
            await register({
                ...registrationData,
                name: registrationData.name.trim(),
                email: registrationData.email.trim().toLowerCase(),
                phoneNumber: registrationData.phoneNumber.trim() || undefined,
            });
            navigate('/login');
        } catch (err) {
            setError(
                err.response?.data?.message || 
                err.response?.data?.error ||
                err.message || 
                'Registration failed. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
          <section className="auth-card">
            <header className="auth-card__header">
                <p className="auth-card__eyebrow">Get started</p>
                <h1>Create your account</h1>
                <p className="auth-card__subtitle">Choose the account type that matches how you use the car rental platform.</p>
            </header>
            
            {error && (
                <div className="auth-card__alert" role="alert" aria-live="assertive">
                    {error}
                </div>
            )}

            <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
                <fieldset className="auth-card__role-group">
                    <legend className="form-label">Account type *</legend>
                    <div className="auth-card__role-options">
                        {[
                            {
                                value: 'CUSTOMER',
                                label: 'Customer',
                                description: 'Book and manage rental vehicles.'
                            },
                            {
                                value: 'OWNER',
                                label: 'Owner',
                                description: 'List and manage your vehicles.'
                            },
                            {
                                value: 'AGENCY',
                                label: 'Agency',
                                description: 'Manage rental operations and fleet.'
                            }
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={`auth-card__role-option${formData.role === option.value ? ' is-selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={option.value}
                                    checked={formData.role === option.value}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                                <span>
                                    <strong>{option.label}</strong>
                                    <small>{option.description}</small>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name *</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        autoComplete="name"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phoneNumber" className="form-label">Mobile Number</label>
                    <input
                        id="phoneNumber"
                        type="tel"
                        name="phoneNumber"
                        className="form-input"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        autoComplete="tel"
                        inputMode="tel"
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
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                    <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className="form-input"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        required
                        disabled={isLoading}
                        minLength={8}
                        maxLength={72}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password *</label>
                    <div className="auth-card__password">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a strong password"
                            autoComplete="new-password"
                            required
                            disabled={isLoading}
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="auth-card__password-toggle"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                <p className="auth-card__hint">
                    Passwords must be 8-72 characters and include letters and numbers.
                    Agency and owner accounts may require administrator verification before using role-specific features.
                </p>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary btn-md auth-card__button"
                >
                    {isLoading ? 'Creating Account...' : 'Register'}
                </button>
            </form>

            <p className="auth-card__footer">
                Already have an account?{' '}
                <Link to="/login">Log In</Link>
            </p>
          </section>
        </div>
    );
};

export default RegisterForm;