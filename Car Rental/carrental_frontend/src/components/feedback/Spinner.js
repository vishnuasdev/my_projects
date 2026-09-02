import React from 'react';

const Spinner = ({ size = 'md' }) => {
    const dimensions = { sm: '20px', md: '36px', lg: '50px' };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <div
                style={{
                    width: dimensions[size],
                    height: dimensions[size],
                    border: '3px solid #e5e7eb',
                    borderTop: '3px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }}
            />
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default Spinner;