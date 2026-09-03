import React, { useEffect, useState } from 'react';
import BookingTable from '../bookings/components/BookingTable';
import Spinner from '../../components/feedback/Spinner';
import { agencyApi } from '../agency/api/agencyApi';

const tabs = [
    { id: 'BOOKINGS', label: 'Customer Bookings' },
    { id: 'BIDS', label: 'Owner Bid Requests' },
    { id: 'FLEET', label: 'Fleet & Availability' },
];

const statusStyle = (status) => ({
    color: status === 'ACCEPTED' ? '#166534' : status === 'REJECTED' ? '#b91c1c' : '#92400e',
    backgroundColor: status === 'ACCEPTED' ? '#dcfce7' : status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
});

const AgencyView = () => {
    const [activeTab, setActiveTab] = useState('BOOKINGS');
    const [bookings, setBookings] = useState([]);
    const [bids, setBids] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        const results = await Promise.allSettled([agencyApi.getBookings(), agencyApi.getBids(), agencyApi.getCars()]);
        const [bookingResult, bidResult, carResult] = results;
        if (bookingResult.status === 'fulfilled') setBookings(bookingResult.value || []);
        if (bidResult.status === 'fulfilled') setBids(bidResult.value || []);
        if (carResult.status === 'fulfilled') setCars(carResult.value || []);
        if (results.some(result => result.status === 'rejected')) setError('Some agency details could not be loaded. Please try again.');
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleBookingStatus = async (bookingId, status) => {
        setBusyId(bookingId);
        try { await agencyApi.updateBookingStatus(bookingId, status); await fetchData(); }
        catch (requestError) { setError('Unable to update the booking status.'); }
        finally { setBusyId(null); }
    };

    const handleBidStatus = async (bid, status) => {
        setBusyId(bid.id);
        try { await agencyApi.updateBidStatus(bid.id, status); await fetchData(); }
        catch (requestError) { setError('Unable to update the owner bid.'); }
        finally { setBusyId(null); }
    };

    const handleAvailability = async (car) => {
        setBusyId(car.id);
        try { await agencyApi.setCarAvailability(car.id, !car.isAvailable); await fetchData(); }
        catch (requestError) { setError('Unable to update car availability.'); }
        finally { setBusyId(null); }
    };

    if (loading) return <Spinner size="lg" />;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div><h2 style={{ margin: 0 }}>Agency Operations Dashboard</h2><p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Manage customer rentals, owner vehicles, and availability.</p></div>
                <button onClick={fetchData} style={{ padding: '0.55rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Refresh Details</button>
            </div>
            {error && <div role="alert" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '0.7rem 1rem', border: 'none', borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent', background: 'transparent', color: activeTab === tab.id ? '#1d4ed8' : '#475569', fontWeight: 600, cursor: 'pointer' }}>{tab.label}</button>)}
            </div>
            {activeTab === 'BOOKINGS' && <BookingTable bookings={bookings} onStatusUpdate={handleBookingStatus} isAgency={true} />}
            {activeTab === 'BIDS' && <BidTable bids={bids} busyId={busyId} onStatusUpdate={handleBidStatus} />}
            {activeTab === 'FLEET' && <FleetTable cars={cars} busyId={busyId} onAvailabilityChange={handleAvailability} />}
        </div>
    );
};

const BidTable = ({ bids, busyId, onStatusUpdate }) => {
    if (!bids.length) return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No owner bid requests found.</p>;
    return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}><thead><tr style={{ background: '#f1f5f9', textAlign: 'left' }}><th style={{ padding: '0.75rem' }}>Vehicle</th><th style={{ padding: '0.75rem' }}>Owner</th><th style={{ padding: '0.75rem' }}>Rate/Day</th><th style={{ padding: '0.75rem' }}>Status</th><th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th></tr></thead><tbody>{bids.map(bid => { const status = String(bid.status || 'PENDING').toUpperCase(); return <tr key={bid.id} style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.75rem', fontWeight: 600 }}>{bid.car ? `${bid.car.brand || ''} ${bid.car.model || ''}` : `Car #${bid.carId || bid.id}`}</td><td style={{ padding: '0.75rem' }}>{bid.owner?.name || bid.owner?.email || `Owner #${bid.owner?.id || '-'}`}</td><td style={{ padding: '0.75rem' }}>₹{Number(bid.ratePerDay || 0).toLocaleString('en-IN')}</td><td style={{ padding: '0.75rem' }}><span style={statusStyle(status)}>{status}</span></td><td style={{ padding: '0.75rem', textAlign: 'right' }}>{status === 'PENDING' && <span style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}><button disabled={busyId === bid.id} onClick={() => onStatusUpdate(bid, 'ACCEPTED')} style={{ padding: '0.4rem 0.65rem', border: 0, borderRadius: '4px', color: '#fff', background: '#16a34a', cursor: 'pointer' }}>Accept & Rent</button><button disabled={busyId === bid.id} onClick={() => onStatusUpdate(bid, 'REJECTED')} style={{ padding: '0.4rem 0.65rem', border: 0, borderRadius: '4px', color: '#fff', background: '#dc2626', cursor: 'pointer' }}>Reject</button></span>}</td></tr>; })}</tbody></table></div>;
};

const FleetTable = ({ cars, busyId, onAvailabilityChange }) => {
    if (!cars.length) return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No cars assigned to this agency.</p>;
    return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}><thead><tr style={{ background: '#f1f5f9', textAlign: 'left' }}><th style={{ padding: '0.75rem' }}>Vehicle</th><th style={{ padding: '0.75rem' }}>Registration</th><th style={{ padding: '0.75rem' }}>Fuel / Transmission</th><th style={{ padding: '0.75rem' }}>Rate/Day</th><th style={{ padding: '0.75rem' }}>Bid Status</th><th style={{ padding: '0.75rem' }}>Availability</th></tr></thead><tbody>{cars.map(car => { const bidStatus = String(car.bidStatus || 'PENDING').toUpperCase(); return <tr key={car.id} style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.75rem', fontWeight: 600 }}>{car.brand} {car.model}<div style={{ color: '#64748b', fontWeight: 400, marginTop: '0.2rem' }}>{car.description || 'No description'}</div></td><td style={{ padding: '0.75rem' }}>{car.registrationNo || '-'}</td><td style={{ padding: '0.75rem' }}>{car.fuelType || '-'} / {car.transmission || '-'}</td><td style={{ padding: '0.75rem' }}>₹{Number(car.dailyRate || 0).toLocaleString('en-IN')}</td><td style={{ padding: '0.75rem' }}><span style={statusStyle(bidStatus)}>{bidStatus}</span></td><td style={{ padding: '0.75rem' }}><button disabled={busyId === car.id || bidStatus !== 'ACCEPTED'} onClick={() => onAvailabilityChange(car)} style={{ padding: '0.4rem 0.65rem', border: 0, borderRadius: '4px', color: '#fff', background: car.isAvailable ? '#16a34a' : '#64748b', cursor: bidStatus === 'ACCEPTED' ? 'pointer' : 'not-allowed' }}>{car.isAvailable ? 'Available' : 'Unavailable'}</button></td></tr>; })}</tbody></table></div>;
};

export default AgencyView;