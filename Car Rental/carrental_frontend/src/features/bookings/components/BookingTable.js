import React from 'react';
import StatusBadge from './StatusBadge';
import Button from '../../../components/ui/Button';

const BookingTable = ({ bookings, onStatusUpdate, isAgency = false, cancellingId = null }) => {
    if (!bookings || bookings.length === 0) {
        return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No bookings found.</p>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>Vehicle</th>
                    <th style={{ padding: '12px' }}>Dates</th>
                    <th style={{ padding: '12px' }}>Total</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {bookings.map((booking) => (
                    <tr key={booking.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>
                            {booking.car
                                ? `${booking.car.brand || ''} ${booking.car.model || ''}`.trim()
                                : booking.vehicle
                                    ? `${booking.vehicle.brand || booking.vehicle.make || ''} ${booking.vehicle.model || ''}`.trim()
                                    : `Car #${booking.carId || booking.vehicleId || booking.id}`}
                        </td>
                        <td style={{ padding: '12px' }}>
                            {booking.startDate} to {booking.endDate}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px' }}>
                            <StatusBadge status={booking.status} />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                            {isAgency && booking.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button size="sm" variant="primary" onClick={() => onStatusUpdate(booking.id, 'CONFIRMED')}>
                                        Approve
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => onStatusUpdate(booking.id, 'REJECTED')}>
                                        Reject
                                    </Button>
                                </div>
                            )}
                            {!isAgency && booking.status === 'PENDING' && (
                                <Button size="sm" variant="outline" disabled={cancellingId === booking.id} onClick={() => onStatusUpdate(booking.id, 'CANCELLED')}>
                                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                                </Button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default BookingTable;