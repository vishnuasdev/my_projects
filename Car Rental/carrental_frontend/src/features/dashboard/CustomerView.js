import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import PublicView from './PublicView';
import { useAuth } from '../auth/hooks/useAuth';
import { bookingApi } from '../bookings/api/bookingApi';
import BookingTable from '../bookings/components/BookingTable';
import Spinner from '../../components/feedback/Spinner';

const CustomerView = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('CATALOG'); // 'CATALOG' | 'BOOKINGS'
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [bookingsError, setBookingsError] = useState('');
    const [bookingFilter, setBookingFilter] = useState('ALL');
    const [cancellingId, setCancellingId] = useState(null);
    const bookingsRequestId = useRef(0);

    const fetchBookings = useCallback(async () => {
        const requestId = ++bookingsRequestId.current;
        setBookingsError('');
        setLoadingBookings(true);
        try {
            const data = await bookingApi.getCustomerBookings();
            if (requestId === bookingsRequestId.current) {
                setBookings(data || []);
            }
        } catch (error) {
            console.error('Error fetching customer bookings:', error);
            if (requestId === bookingsRequestId.current) {
                setBookingsError('Unable to load your bookings. Please try again.');
            }
        } finally {
            if (requestId === bookingsRequestId.current) {
                setLoadingBookings(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings, user?.id]);

    const handleCancelBooking = async (bookingId) => {
        if (cancellingId) return;
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

    const bookingCounts = useMemo(() => {
        return bookings.reduce((counts, booking) => {
            const status = String(booking.status || 'PENDING').toUpperCase();
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, {});
    }, [bookings]);

    const visibleBookings = useMemo(() => {
        if (bookingFilter === 'ALL') return bookings;
        return bookings.filter(booking => String(booking.status || 'PENDING').toUpperCase() === bookingFilter);
    }, [bookings, bookingFilter]);

    const customerName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'there';

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            {/* Header Banner */}
            <header style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 0' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    flexWrap: 'wrap'
                }}>
                    <div>
                        <p style={{ margin: 0, color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Customer Dashboard</p>
                        <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Welcome, {customerName}</h1>
                        <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Find a vehicle, select dates, and track your active reservations.</p>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            <span style={{ padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.75rem', fontWeight: 600 }}>
                                {bookings.length} Total Bookings
                            </span>
                            <span style={{ padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#fef3c7', border: '1px solid #fcd34d', color: '#b45309', fontSize: '0.75rem', fontWeight: 600 }}>
                                {bookingCounts.PENDING || 0} Awaiting Approval
                            </span>
                            <span style={{ padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', fontSize: '0.75rem', fontWeight: 600 }}>
                                {bookingCounts.APPROVED || bookingCounts.CONFIRMED || 0} Approved
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            onClick={() => setActiveTab('CATALOG')}
                            style={{
                                padding: '0.6rem 1.1rem',
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: activeTab === 'CATALOG' ? '#2563eb' : '#cbd5e1',
                                background: activeTab === 'CATALOG' ? '#2563eb' : '#fff',
                                color: activeTab === 'CATALOG' ? '#fff' : '#334155',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            Browse Vehicles
                        </button>
                        <button 
                            onClick={() => setActiveTab('BOOKINGS')}
                            style={{
                                padding: '0.6rem 1.1rem',
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: activeTab === 'BOOKINGS' ? '#2563eb' : '#cbd5e1',
                                background: activeTab === 'BOOKINGS' ? '#2563eb' : '#fff',
                                color: activeTab === 'BOOKINGS' ? '#fff' : '#334155',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            My Bookings ({bookings.length})
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Sections */}
            <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem' }}>
                {activeTab === 'CATALOG' ? (
                    <PublicView isCustomerView={true} user={user} />
                ) : (
                    <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>My Bookings</h2>
                                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Track rental requests, approvals, and trip history.</p>
                                <p style={{ margin: '0.5rem 0 0', color: '#92400e', fontSize: '0.8rem' }}>Pending requests are not confirmed until the assigned agency accepts them.</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={fetchBookings} 
                                disabled={loadingBookings} 
                                style={{ padding: '0.5rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#334155', cursor: loadingBookings ? 'wait' : 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                            >
                                {loadingBookings ? 'Refreshing...' : 'Refresh Bookings'}
                            </button>
                        </div>

                        {/* Status Filters */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.25rem 0' }}>
                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map(status => (
                                <button 
                                    key={status} 
                                    type="button" 
                                    onClick={() => setBookingFilter(status)} 
                                    style={{ 
                                        padding: '0.4rem 0.8rem', 
                                        border: '1px solid', 
                                        borderColor: bookingFilter === status ? '#2563eb' : '#cbd5e1', 
                                        borderRadius: '9999px', 
                                        background: bookingFilter === status ? '#2563eb' : '#fff', 
                                        color: bookingFilter === status ? '#fff' : '#475569', 
                                        cursor: 'pointer', 
                                        fontSize: '0.8rem',
                                        fontWeight: 600
                                    }}
                                >
                                    {status} ({status === 'ALL' ? bookings.length : bookingCounts[status] || 0})
                                </button>
                            ))}
                        </div>

                        {bookingsError && (
                            <div role="alert" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                                {bookingsError}
                            </div>
                        )}

                        {loadingBookings ? (
                            <Spinner />
                        ) : (
                            <BookingTable 
                                bookings={visibleBookings} 
                                onStatusUpdate={handleCancelBooking} 
                                cancellingId={cancellingId} 
                            />
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default CustomerView;