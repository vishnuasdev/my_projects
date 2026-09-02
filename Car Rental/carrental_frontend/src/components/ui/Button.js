import React from 'react';

const Button = ({
                    children,
                    type = 'button',
                    variant = 'primary',
                    size = 'md',
                    isLoading = false,
                    disabled = false,
                    onClick,
                    className = '',
                    style = {},
                    ...props
                }) => {
    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        borderRadius: '6px',
        border: 'none',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease-in-out',
        opacity: disabled || isLoading ? 0.65 : 1,
    };

    const variants = {
        primary: { backgroundColor: '#2563eb', color: '#ffffff' },
        secondary: { backgroundColor: '#4b5563', color: '#ffffff' },
        danger: { backgroundColor: '#dc2626', color: '#ffffff' },
        outline: { backgroundColor: 'transparent', color: '#2563eb', border: '1px solid #2563eb' },
    };

    const sizes = {
        sm: { padding: '6px 12px', fontSize: '0.875rem' },
        md: { padding: '10px 18px', fontSize: '1rem' },
        lg: { padding: '14px 24px', fontSize: '1.125rem' },
    };

    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            onClick={onClick}
            style={{
                ...baseStyles,
                ...variants[variant],
                ...sizes[size],
                ...style,
            }}
            className={className}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
};

export default Button;