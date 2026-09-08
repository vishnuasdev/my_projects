import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import BookingTable from '../bookings/components/BookingTable';
import Spinner from '../../components/feedback/Spinner';
import { agencyApi } from '../agency/api/agencyApi';
import VehicleModal from '../fleet/components/VehicleModal';

const tabs = [
    { id: 'BOOKINGS', label: 'Customer Bookings' },
    { id: 'BIDS', label: 'Owner Bid Requests' },
    { id: 'FLEET', label: 'Fleet & Availability' },
];

const statusStyle = (status) => {
    const isSuccess = status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'COMPLETED';
    const isDanger = status === 'REJECTED' || status === 'CANCELLED';
    return {
        color: isSuccess ? '#15803d' : isDanger ? '#b91c1c' : '#b45309',
        backgroundColor: isSuccess ? '#dcfce7' : isDanger ? '#fee2e2' : '#fef3c7',
        padding: '0.25rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
    };
};

const AgencyView = () => {
    const [activeTab, setActiveTab] = useState('BOOKINGS');
    const [bookings, setBookings] = useState([]);
    const [bids, setBids] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [editingCar, setEditingCar] = useState(null);
    const requestSequence = useRef(0);

    // Feature State: Search, Notifications & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const generateNotifications = useCallback((bidsList, bookingsList) => {
        const notifs = [];
        
        // Filter pending bids for notifications
        const pendingBids = bidsList.filter(b => String(b.status).toUpperCase() === 'PENDING');
        pendingBids.forEach(bid => {
            notifs.push({
                id: `bid-${bid.id}`,
                type: 'BID',
                title: 'New Vehicle Bid Received',
                message: `Owner ${bid.owner?.name || 'Owner'} requested ₹${bid.ratePerDay}/day for ${bid.car?.brand || 'Car'} ${bid.car?.model || ''}`,
                time: 'Recently',
                targetTab: 'BIDS',
                read: false
            });
        });

        // Filter new/pending bookings for notifications
        const pendingBookings = bookingsList.filter(b => String(b.status).toUpperCase() === 'PENDING');
        pendingBookings.forEach(booking => {
            notifs.push({
                id: `booking-${booking.id}`,
                type: 'BOOKING',
                title: 'New Customer Booking Request',
                message: `Booking #${booking.id} created for ${booking.car?.brand || 'Vehicle'} (${booking.noOfDays || 1} Days)`,
                time: 'Recently',
                targetTab: 'BOOKINGS',
                read: false
            });
        });

        setNotifications(notifs);
        setUnreadCount(notifs.length);
    }, []);

    const fetchData = useCallback(async () => {
        const requestId = ++requestSequence.current;
        setLoading(true);
        setError('');
        const results = await Promise.allSettled([agencyApi.getBookings(), agencyApi.getBids(), agencyApi.getCars()]);
        if (requestId !== requestSequence.current) return;
        const [bookingResult, bidResult, carResult] = results;

        let freshBookings = [];
        let freshBids = [];
        let freshCars = [];

        if (bookingResult.status === 'fulfilled') {
            freshBookings = bookingResult.value || [];
            setBookings(freshBookings);
        }
        if (bidResult.status === 'fulfilled') {
            freshBids = bidResult.value || [];
            setBids(freshBids);
        }
        if (carResult.status === 'fulfilled') {
            freshCars = carResult.value || [];
            setCars(freshCars);
        }

        if (results.some(result => result.status === 'rejected')) {
            setError('Some agency details could not be loaded. Please try again.');
        }

        // Generate dynamic notifications from incoming PENDING Bids and BOOKINGS
        generateNotifications(freshBids, freshBookings);
        setLoading(false);
    }, [generateNotifications]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    const markNotificationsAsRead = () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications) {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const handleBookingStatus = async (bookingId, status) => {
        if (busyId !== null) return;
        setBusyId(bookingId);
        try { 
            await agencyApi.updateBookingStatus(bookingId, status);
            await fetchData(); 
        } catch (requestError) { 
            setError('Unable to update the booking status.'); 
        } finally { 
            setBusyId(null); 
        }
    };

    const handleBidStatus = async (bid, status) => {
        if (busyId !== null) return;
        setBusyId(bid.id);
        try { 
            await agencyApi.updateBidStatus(bid.id, status); 
            await fetchData(); 
        } catch (requestError) { 
            setError('Unable to update the owner bid.'); 
        } finally { 
            setBusyId(null); 
        }
    };

    const handleAvailability = async (car) => {
        if (busyId !== null) return;
        setBusyId(car.id);
        try { 
            await agencyApi.setCarAvailability(car.id, !car.isAvailable); 
            await fetchData(); 
        } catch (requestError) { 
            setError('Unable to update car availability.'); 
        } finally { 
            setBusyId(null); 
        }
    };

    const handleUpdateCar = async (carData, images) => {
        try {
            await agencyApi.updateCar(editingCar.id, carData, images);
            setEditingCar(null);
            await fetchData();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to update car details.');
            throw requestError;
        }
    };

    // Derived Analytics Statistics
    const analytics = useMemo(() => {
        const pendingBids = bids.filter(b => String(b.status).toUpperCase() === 'PENDING').length;
        const activeFleet = cars.filter(c => c.isAvailable && String(c.bidStatus).toUpperCase() === 'ACCEPTED').length;
        const activeBookings = bookings.filter(b => ['CONFIRMED', 'PENDING'].includes(String(b.status).toUpperCase())).length;
        const totalRevenue = bookings
            .filter(b => String(b.status).toUpperCase() === 'COMPLETED' || String(b.status).toUpperCase() === 'CONFIRMED')
            .reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);

        return { pendingBids, activeFleet, activeBookings, totalRevenue };
    }, [bids, cars, bookings]);

    // Filtered Datasets based on search query and status dropdown
    const filteredBids = useMemo(() => {
        return bids.filter(bid => {
            const matchesSearch = 
                (bid.car?.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (bid.car?.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (bid.owner?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || String(bid.status).toUpperCase() === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [bids, searchQuery, statusFilter]);

    const filteredFleet = useMemo(() => {
        return cars.filter(car => {
            const matchesSearch = 
                (car.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (car.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (car.registrationNo || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || 
                (statusFilter === 'AVAILABLE' && car.isAvailable) || 
                (statusFilter === 'UNAVAILABLE' && !car.isAvailable);
            return matchesSearch && matchesStatus;
        });
    }, [cars, searchQuery, statusFilter]);

    if (loading) return <Spinner size="lg" />;

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            {/* Header & Notifications Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 700 }}>Agency Operations Dashboard</h2>
                    <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Manage customer rentals, owner vehicle proposals, and fleet operations.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                    
                    {/* Notification Button */}
                    <button 
                        onClick={markNotificationsAsRead}
                        style={{ 
                            position: 'relative', 
                            padding: '0.55rem 0.9rem', 
                            border: '1px solid #cbd5e1', 
                            borderRadius: '8px', 
                            background: '#fff', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            fontWeight: 600,
                            color: '#334155',
                            fontSize: '0.875rem'
                        }}
                        title="Notifications"
                    >
                        Notifications
                        {unreadCount > 0 && (
                            <span style={{
                                marginLeft: '0.5rem',
                                backgroundColor: '#ef4444',
                                color: '#fff',
                                borderRadius: '9999px',
                                padding: '1px 6px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Panel Modal */}
                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            top: '48px',
                            right: 0,
                            width: '320px',
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            zIndex: 100,
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Notifications</span>
                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{notifications.length} Total</span>
                            </div>
                            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <p style={{ padding: '1rem', margin: 0, color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>No new notifications.</p>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id}
                                            onClick={() => { setActiveTab(notif.targetTab); setShowNotifications(false); }}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: 'pointer',
                                                backgroundColor: notif.read ? '#fff' : '#f0f9ff'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{notif.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>{notif.message}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={fetchData} 
                        style={{ padding: '0.55rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}
                    >
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Analytics Summary Cards Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE RENTALS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{analytics.activeBookings}</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>AVAILABLE FLEET</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>{analytics.activeFleet} Vehicles</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>PENDING OWNER BIDS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>{analytics.pendingBids} Requests</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>ESTIMATED REVENUE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', marginTop: '0.25rem' }}>₹{analytics.totalRevenue.toLocaleString('en-IN')}</div>
                </div>
            </div>

            {error && <div role="alert" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>{error}</div>}

            {/* Navigation Tabs and Quick Search Filter Bar */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {tabs.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => { setActiveTab(tab.id); setStatusFilter('ALL'); setSearchQuery(''); }} 
                                style={{ 
                                    padding: '0.6rem 1rem', 
                                    border: 'none', 
                                    borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent', 
                                    background: 'transparent', 
                                    color: activeTab === tab.id ? '#1d4ed8' : '#475569', 
                                    fontWeight: 600, 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Search & Status Filter Controls */}
                    {activeTab !== 'BOOKINGS' && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                                type="text"
                                placeholder={`Search ${activeTab.toLowerCase()}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ padding: '0.4rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                            />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ padding: '0.4rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#fff' }}
                            >
                                <option value="ALL">All Statuses</option>
                                {activeTab === 'BIDS' && (
                                    <>
                                        <option value="PENDING">Pending</option>
                                        <option value="ACCEPTED">Accepted</option>
                                        <option value="REJECTED">Rejected</option>
                                    </>
                                )}
                                {activeTab === 'FLEET' && (
                                    <>
                                        <option value="AVAILABLE">Available</option>
                                        <option value="UNAVAILABLE">Unavailable</option>
                                    </>
                                )}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Views */}
            {activeTab === 'BOOKINGS' && <BookingTable bookings={bookings} onStatusUpdate={handleBookingStatus} isAgency={true} cancellingId={busyId} />}
            {activeTab === 'BIDS' && <BidTable bids={filteredBids} busyId={busyId} onStatusUpdate={handleBidStatus} />}
            {activeTab === 'FLEET' && <FleetTable cars={filteredFleet} busyId={busyId} onAvailabilityChange={handleAvailability} onEdit={setEditingCar} />}

            <VehicleModal
                isOpen={Boolean(editingCar)}
                initialData={editingCar}
                onClose={() => setEditingCar(null)}
                onSubmit={handleUpdateCar}
            />
        </div>
    );
};

const BidTable = ({ bids, busyId, onStatusUpdate }) => {
    if (!bids.length) return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '8px' }}>No owner bid requests matching criteria.</p>;
    return (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Vehicle</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Owner</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Rate/Day</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bids.map(bid => { 
                        const status = String(bid.status || 'PENDING').toUpperCase(); 
                        return (
                            <tr key={bid.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                    {bid.car ? `${bid.car.brand || ''} ${bid.car.model || ''}` : `Car #${bid.carId || bid.id}`}
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>{bid.owner?.name || bid.owner?.email || `Owner #${bid.owner?.id || '-'}`}</td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>₹{Number(bid.ratePerDay || 0).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '0.75rem 1rem' }}><span style={statusStyle(status)}>{status}</span></td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                    {status === 'PENDING' && (
                                        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                            <button disabled={busyId === bid.id} onClick={() => onStatusUpdate(bid, 'ACCEPTED')} style={{ padding: '0.4rem 0.65rem', border: 0, borderRadius: '6px', color: '#fff', background: '#16a34a', cursor: 'pointer', fontWeight: 600 }}>Accept & Rent</button>
                                            <button disabled={busyId === bid.id} onClick={() => onStatusUpdate(bid, 'REJECTED')} style={{ padding: '0.4rem 0.65rem', border: 0, borderRadius: '6px', color: '#fff', background: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>Reject</button>
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ); 
                    })}
                </tbody>
            </table>
        </div>
    );
};

const FleetTable = ({ cars, busyId, onAvailabilityChange, onEdit }) => {
    if (!cars.length) return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '8px' }}>No cars matching criteria.</p>;
    return (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Vehicle</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Registration</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Fuel / Transmission</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Rate/Day</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Bid Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Availability</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {cars.map(car => { 
                        const bidStatus = String(car.bidStatus || 'PENDING').toUpperCase(); 
                        return (
                            <tr key={car.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                    {car.brand} {car.model}
                                    <div style={{ color: '#64748b', fontWeight: 400, marginTop: '0.2rem', fontSize: '0.75rem' }}>{car.description || 'No description'}</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>{car.registrationNo || '-'}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>{car.fuelType || '-'} / {car.transmission || '-'}</td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>₹{Number(car.dailyRate || 0).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '0.75rem 1rem' }}><span style={statusStyle(bidStatus)}>{bidStatus}</span></td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <button 
                                        disabled={busyId === car.id || bidStatus !== 'ACCEPTED'} 
                                        onClick={() => onAvailabilityChange(car)} 
                                        style={{ 
                                            padding: '0.4rem 0.65rem', 
                                            border: 0, 
                                            borderRadius: '6px', 
                                            color: '#fff', 
                                            background: car.isAvailable ? '#16a34a' : '#64748b', 
                                            cursor: bidStatus === 'ACCEPTED' ? 'pointer' : 'not-allowed',
                                            fontWeight: 600
                                        }}
                                    >
                                        {car.isAvailable ? 'Available' : 'Unavailable'}
                                    </button>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                    <button onClick={() => onEdit(car)} style={{ padding: '0.4rem 0.65rem', border: 0, borderRadius: '6px', color: '#1d4ed8', background: '#dbeafe', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                </td>
                            </tr>
                        ); 
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AgencyView;