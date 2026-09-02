import React, { useState, useEffect } from 'react';
import { bookingApi } from '../bookings/api/bookingApi';
import BookingTable from '../bookings/components/BookingTable';
import Spinner from '../../components/feedback/Spinner';
import { useAuth } from '../auth/hooks/useAuth';

const AgencyView = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const agencyId = user?.id || user?.userId;
            if (!agencyId) {
                setBookings([]);
                return;
            }
            const bookingData = await bookingApi.getAgencyBookings(agencyId);
            setBookings(bookingData);
        } catch (error) {
            console.error('Error fetching agency dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleStatusUpdate = async (bookingId, newStatus) => {
        await bookingApi.updateBookingStatus(bookingId, newStatus);
        fetchData();
    };

    if (loading) return <Spinner size="lg" />;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Agency Operations Dashboard</h2>
            </div>

            <section>
                <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Incoming Booking Requests</h3>
                <BookingTable bookings={bookings} onStatusUpdate={handleStatusUpdate} isAgency={true} />
            </section>

        </div>
    );
};

export default AgencyView;