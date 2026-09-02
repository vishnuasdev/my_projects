import React, { useEffect, useState } from 'react';
import PublicView from './PublicView';
import { useAuth } from '../auth/hooks/useAuth';
import { bookingApi } from '../bookings/api/bookingApi';
import BookingTable from '../bookings/components/BookingTable';
import Spinner from '../../components/feedback/Spinner';

const CustomerView = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [bookingsError, setBookingsError] = useState('');
    const [bookingFilter, setBookingFilter] = useState('ALL');
    const [cancellingId, setCancellingId] = useState(null);

    const fetchBookings = async () => {
        setBookingsError('');
        setLoadingBookings(true);
        try {
            setBookings(await bookingApi.getCustomerBookings());
        } catch (error) {
            console.error('Error fetching customer bookings:', error);
            setBookingsError('Unable to load your bookings. Please try again.');
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [user]);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Cancel this booking request?')) return;
        setCancellingId(bookingId);
        try {
            await bookingApi.cancelBooking(bookingId);
            await fetchBookings();
        } catch (error) {
            setBookingsError('Unable to cancel this booking. Please try again.');
        } finally {
            setCancellingId(null);
        }
    };

    const bookingCounts = bookings.reduce((counts, booking) => {
        const status = String(booking.status || 'PENDING').toUpperCase();
        counts[status] = (counts[status] || 0) + 1;
        return counts;
    }, {});
    const visibleBookings = bookingFilter === 'ALL'
        ? bookings
        : bookings.filter(booking => String(booking.status || 'PENDING').toUpperCase() === bookingFilter);

    const customerName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'there';

    // CustomerView is the same as PublicView, just shown to logged-in customers
    // The user object is available for any customer-specific logic in the future
    // For now, they see the exact same vehicle browsing interface
    
    return (
        <div className="customer-dashboard">
            <style>{`
                .customer-dashboard {
                    min-height: 100vh;
                    background: #f6f8fb;
                    color: #172033;
                }

                .customer-welcome {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1.75rem 1rem 0;
                }

                .customer-welcome-panel {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    padding: 1.25rem 1.5rem;
                    border: 1px solid #dbe4f0;
                    border-radius: 12px;
                    background: linear-gradient(110deg, #ffffff 0%, #eef6ff 100%);
                    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.06);
                }

                .customer-summary {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-top: 0.75rem;
                }

                .customer-summary span {
                    padding: 0.35rem 0.65rem;
                    border-radius: 999px;
                    background: #ffffff;
                    border: 1px solid #dbe4f0;
                    color: #526176;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .customer-section-heading {
                    display: flex;
                    align-items: end;
                    justify-content: space-between;
                    gap: 1rem;
                }

                @media (max-width: 640px) {
                    .customer-welcome { padding-top: 1rem; }
                    .customer-welcome-panel { align-items: flex-start; flex-direction: column; padding: 1rem; }
                    .customer-section-heading { align-items: flex-start; flex-direction: column; }
                }
            `}</style>
            <header className="customer-welcome">
                <div className="customer-welcome-panel">
                    <div>
                        <p style={{ margin: 0, color: '#2563eb', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Customer dashboard</p>
                        <h1 style={{ margin: '0.3rem 0 0', fontSize: '1.55rem', lineHeight: 1.2 }}>Welcome, {customerName}</h1>
                        <p style={{ margin: '0.45rem 0 0', color: '#5f6f85', fontSize: '0.9rem' }}>Find a car, choose your dates, and keep every booking in one place.</p>
                        <div className="customer-summary">
                            <span>{bookings.length} total booking{bookings.length === 1 ? '' : 's'}</span>
                            <span>{bookingCounts.PENDING || 0} awaiting approval</span>
                            <span>{bookingCounts.APPROVED || 0} approved</span>
                        </div>
                    </div>
                    <div style={{ minWidth: '92px', textAlign: 'center', padding: '0.75rem', borderRadius: '10px', background: '#2563eb', color: '#ffffff' }}>
                        <strong style={{ display: 'block', fontSize: '1.5rem', lineHeight: 1 }}>{bookings.length}</strong>
                        <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.72rem' }}>bookings</span>
                    </div>
                </div>
            </header>
            <PublicView isCustomerView={true} user={user} />
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1rem 3rem' }}>
                <div className="customer-section-heading" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>My Bookings</h2>
                        <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Track requests, approvals, and completed rentals.</p>
                    </div>
                    <button type="button" onClick={fetchBookings} disabled={loadingBookings} style={{ padding: '0.5rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#334155', cursor: loadingBookings ? 'wait' : 'pointer' }}>
                        {loadingBookings ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map(status => (
                        <button key={status} type="button" onClick={() => setBookingFilter(status)} style={{ padding: '0.4rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '999px', background: bookingFilter === status ? '#2563eb' : '#fff', color: bookingFilter === status ? '#fff' : '#475569', cursor: 'pointer', fontSize: '0.8rem' }}>
                            {status} ({status === 'ALL' ? bookings.length : bookingCounts[status] || 0})
                        </button>
                    ))}
                </div>
                {bookingsError && <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>{bookingsError}</div>}
                {loadingBookings ? <Spinner /> : <BookingTable bookings={visibleBookings} onStatusUpdate={handleCancelBooking} cancellingId={cancellingId} />}
            </section>
        </div>
    );
};

export default CustomerView;