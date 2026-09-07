import React from 'react';

const StatusBadge = ({ status }) => {
    const normalizedStatus = status ? status.toUpperCase() : 'PENDING';

    const badgeStyles = {
        PENDING: { bg: '#fef3c7', text: '#d97706', label: 'Pending Approval' },
        CONFIRMED: { bg: '#dcfce7', text: '#15803d', label: 'Confirmed' },
        APPROVED: { bg: '#dcfce7', text: '#15803d', label: 'Confirmed' },
        REJECTED: { bg: '#fee2e2', text: '#b91c1c', label: 'Rejected' },
        CANCELLED: { bg: '#f1f5f9', text: '#64748b', label: 'Cancelled' },
        COMPLETED: { bg: '#e0e7ff', text: '#4338ca', label: 'Completed' },
    };

    const style = badgeStyles[normalizedStatus] || badgeStyles.PENDING;

    return (
        <span
            style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: style.bg,
                color: style.text,
            }}
        >
      {style.label}
    </span>
    );
};

export default StatusBadge;