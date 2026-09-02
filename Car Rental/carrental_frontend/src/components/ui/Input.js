import React from 'react';

const Input = ({
                   label,
                   type = 'text',
                   name,
                   value,
                   onChange,
                   placeholder = '',
                   error = '',
                   required = false,
                   disabled = false,
                   className = '',
                   ...props
               }) => {
    return (
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column' }} className={className}>
            {label && (
                <label style={{ marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem', color: '#374151' }}>
                    {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: error ? '1px solid #dc2626' : '1px solid #d1d5db',
                    fontSize: '0.95rem',
                    outline: 'none',
                    backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
                }}
                {...props}
            />
            {error && <span style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#dc2626' }}>{error}</span>}
        </div>
    );
};

export default Input;