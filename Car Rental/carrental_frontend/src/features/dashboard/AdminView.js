import React, { useState, useEffect } from 'react';
import ReportsManager from '../reports/components/ReportsManager';
import { fleetApi } from '../fleet/api/fleetApi';
import VehicleModal from '../fleet/components/VehicleModal';
import { adminApi } from '../admin/api/adminApi';

const formatDetailLabel = (key) => key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const formatDetailValue = (value) => {
    if (value === null || value === undefined || value === '') return 'Not provided';
    if (Array.isArray(value)) return value.length ? `${value.length} item(s)` : 'None';
    if (typeof value === 'object') {
        const name = value.name || value.email || value.brand || value.model || value.id;
        return name ? String(name) : 'Details available';
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
};

const getViewEntries = (data, type) => {
    const preferredCarFields = [
        'id', 'brand', 'model', 'registrationNo', 'fuelType', 'transmission',
        'dailyRate', 'description', 'isAvailable', 'bidStatus', 'agencyRemarks',
        'imageCount', 'owner', 'agency'
    ];
    const keys = type === 'CARS'
        ? preferredCarFields.filter(key => Object.prototype.hasOwnProperty.call(data, key))
        : Object.keys(data);
    return keys.filter(key => !['images', 'available'].includes(key));
};

const AdminView = () => {
    const [activeTab, setActiveTab] = useState('USERS');
    
    // Sub-Filter States
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');
    const [agencyFilter, setAgencyFilter] = useState('ALL');
    const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
    const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState('ALL');
    const [bidStatusFilter, setBidStatusFilter] = useState('ALL');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Active Modal Control State
    const [activeModal, setActiveModal] = useState({ type: null, data: null }); // type: 'VIEW' | 'EDIT'
    const [editingCar, setEditingCar] = useState(null);
    const [isCarModalOpen, setIsCarModalOpen] = useState(false);

    // Data Management States
    const [users, setUsers] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [cars, setCars] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [bids, setBids] = useState([]);
    const [summary, setSummary] = useState(null);
    const [bookingId, setBookingId] = useState('');
    const [agencyId, setAgencyId] = useState('');

    const fetchTabData = async (tab, { silent = false } = {}) => {
        if (!silent) setIsLoading(true);
        setError('');
        try {
            if (tab === 'USERS') {
                setUsers(await adminApi.getUsers());
            } else if (tab === 'AGENCIES') {
                setAgencies(await adminApi.getAgencies());
            } else if (tab === 'CARS') {
                setCars(await adminApi.getCars());
            } else if (tab === 'BOOKINGS') {
                setBookings(await adminApi.getBookings());
            } else if (tab === 'BIDS') {
                setBids(await adminApi.getBids());
            }
        } catch (err) {
            setError(`Failed to fetch ${tab.toLowerCase()} data.`);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const fetchSummary = async ({ silent = false } = {}) => {
        try {
            setSummary(await adminApi.getSummary());
        } catch (err) {
            if (!silent) {
                setError('Summary metrics are temporarily unavailable. Showing current records.');
            }
        }
    };

    useEffect(() => {
        fetchTabData(activeTab);
        fetchSummary();

        const refresh = () => {
            if (document.visibilityState === 'visible') {
                fetchTabData(activeTab, { silent: true });
                fetchSummary({ silent: true });
            }
        };
        const intervalId = window.setInterval(refresh, 15000);
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [activeTab]);

    // Generic Delete Handler
    const handleDeleteItem = async (id, tabName) => {
        if (!window.confirm(`Are you sure you want to delete item #${id} from ${tabName}?`)) return;
        try {
            if (tabName === 'CARS') {
                await adminApi.removeCar(id);
            } else if (tabName === 'USERS') {
                await adminApi.removeUser(id);
            } else if (tabName === 'AGENCIES') {
                await adminApi.removeAgency(id);
            } else {
                await adminApi.removeBid(id);
            }
            if (tabName === 'USERS') setUsers(current => current.filter(item => item.id !== id));
            if (tabName === 'AGENCIES') setAgencies(current => current.filter(item => item.id !== id));
            if (tabName === 'CARS') setCars(current => current.filter(item => item.id !== id));
            if (tabName === 'BIDS') setBids(current => current.filter(item => item.id !== id));
            fetchSummary({ silent: true });
        } catch (err) {
            alert(`Failed to delete item from ${tabName}.`);
        }
    };

    const handleUpdateBidStatus = async (bidId, newStatus) => {
        try {
            await adminApi.updateBidStatus(bidId, newStatus);
            setBids(current => current.map(b => b.id === bidId ? { ...b, status: newStatus } : b));
            fetchSummary({ silent: true });
        } catch (err) {
            alert('Failed to update bid status.');
        }
    };

    const handleUpdateUserStatus = async (userId, status) => {
        try {
            const updatedUser = await adminApi.updateUserStatus(userId, status);
            setUsers(current => current.map(user => user.id === userId ? updatedUser : user));
            fetchSummary({ silent: true });
        } catch (err) {
            alert('Failed to update user status.');
        }
    };

    const handleUpdateBookingStatus = async (bookingIdValue, status) => {
        try {
            const updatedBooking = await adminApi.updateBookingStatus(bookingIdValue, status);
            setBookings(current => current.map(booking => booking.id === bookingIdValue ? updatedBooking : booking));
            fetchSummary({ silent: true });
        } catch (err) {
            alert('Failed to update booking status.');
        }
    };

    const handleUpdateCar = async (carData, images) => {
        const updatedCar = editingCar
            ? await fleetApi.updateVehicleAsAdmin(editingCar.id, carData, images)
            : await adminApi.createCar(carData, null, images);

        if (updatedCar?.id) {
            setCars(current => editingCar
                ? current.map(car => car.id === updatedCar.id ? updatedCar : car)
                : [updatedCar, ...current]);
        } else {
            await fetchTabData('CARS');
        }
        setEditingCar(null);
        setIsCarModalOpen(false);
    };

    const handleFindAgency = async (event) => {
        event.preventDefault();
        if (!agencyId) return;
        setIsLoading(true);
        setError('');
        try {
            const agency = await adminApi.getAgency(agencyId);
            setAgencies(agency ? [agency] : []);
        } catch (err) {
            setAgencies([]);
            setError('Agency was not found. Check the ID and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindBooking = async (event) => {
        event.preventDefault();
        if (!bookingId) return;
        setIsLoading(true);
        setError('');
        try {
            const booking = await adminApi.getBooking(bookingId);
            setBookings(booking ? [booking] : []);
        } catch (err) {
            setBookings([]);
            setError('Booking was not found. Check the ID and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelBooking = async (id) => {
        if (!window.confirm(`Cancel booking #${id}?`)) return;
        try {
            await adminApi.cancelBooking(id);
            setBookings(bookings.map(booking => booking.id === id ? { ...booking, status: 'CANCELLED' } : booking));
        } catch (err) {
            alert('Failed to cancel booking.');
        }
    };

    // Modal Form Save Handler
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        const { data } = activeModal;
        try {
            if (activeTab === 'USERS') {
                const updatedUser = await adminApi.updateUser(data.id, data);
                setUsers(users.map(user => user.id === data.id ? updatedUser : user));
            } else if (activeTab === 'AGENCIES') {
                const updatedAgency = await adminApi.updateAgency(data.id, data);
                setAgencies(agencies.map(agency => agency.id === data.id ? updatedAgency : agency));
            } else {
                throw new Error('This record cannot be edited here.');
            }
            setActiveModal({ type: null, data: null });
        } catch (err) {
            alert(`Failed to save edits for ${activeTab}.`);
        }
    };

    const stats = {
        totalUsers: summary?.totalUsers ?? users.length,
        activeFleet: summary?.activeFleet ?? cars.filter(car => car.isAvailable).length,
        totalBookings: summary?.totalBookings ?? bookings.length,
        totalRevenue: summary?.totalRevenue ?? null,
        pendingAgencies: summary?.pendingAgencies ?? agencies.filter(agency => agency.status === 'PENDING').length,
        pendingBookings: summary?.pendingBookings ?? bookings.filter(booking => booking.status === 'PENDING').length,
        pendingBids: summary?.pendingBids ?? bids.filter(bid => bid.status === 'PENDING').length,
    };

    // Filtered Records
    const filteredUsers = users.filter(u => userRoleFilter === 'ALL' || u.role === userRoleFilter);
    const filteredAgencies = agencies.filter(a => agencyFilter === 'ALL' || a.status === agencyFilter);
    const filteredBookings = bookings.filter(b => bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter);
    const filteredCars = cars.filter(v => vehicleCategoryFilter === 'ALL' || (v.type || 'SEDAN') === vehicleCategoryFilter);
    const filteredBids = bids.filter(b => bidStatusFilter === 'ALL' || b.status === bidStatusFilter);

    // Style Helpers
    const cardStyle = {
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    };

    const filterTabStyle = (active) => ({
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        border: '1px solid',
        borderColor: active ? '#2563eb' : '#cbd5e1',
        backgroundColor: active ? '#eff6ff' : '#ffffff',
        color: active ? '#2563eb' : '#475569',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        fontSize: '0.85rem'
    });

    const actionBtnStyle = (bgColor, color) => ({
        padding: '0.3rem 0.6rem',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: bgColor,
        color: color,
        fontWeight: '500',
        fontSize: '0.75rem',
        cursor: 'pointer'
    });

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            {/* Header Title */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>System Administration</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Manage users, agencies, available cars, bookings, marketplace bids, and reports.</p>
            </div>

            {/* Top Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Users</span>
                    <h3 style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{stats.totalUsers}</h3>
                </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {[
                    ['Pending agency approvals', stats.pendingAgencies],
                    ['Pending bookings', stats.pendingBookings],
                    ['Pending bids', stats.pendingBids]
                ].map(([label, value]) => (
                    <div key={label} style={{ padding: '0.55rem 0.8rem', borderRadius: '999px', background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.8rem', fontWeight: 600 }}>
                        {label}: {value}
                    </div>
                ))}
                <button type="button" onClick={() => { setSummary(null); adminApi.getSummary().then(setSummary).catch(() => setError('Summary metrics are temporarily unavailable.')); }} style={{ marginLeft: 'auto', padding: '0.5rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#334155', cursor: 'pointer' }}>
                    Refresh metrics
                </button>
            </div>
                <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Active Fleet</span>
                    <h3 style={{ margin: '0.25rem 0 0 0', color: '#2563eb' }}>{stats.activeFleet}</h3>
                </div>
                <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Bookings</span>
                    <h3 style={{ margin: '0.25rem 0 0 0', color: '#16a34a' }}>{stats.totalBookings}</h3>
                </div>
                <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Revenue</span>
                    <h3 style={{ margin: '0.25rem 0 0 0', color: '#0f766e' }}>{stats.totalRevenue === null ? 'N/A' : `₹${stats.totalRevenue.toLocaleString('en-IN')}`}</h3>
                </div>
            </div>

            {/* --- MASTER 2-COLUMN LAYOUT --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* COLUMN 1: Management Navigation Sidebar */}
                <div style={{ ...cardStyle, padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        Management Sections
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { id: 'USERS', label: 'User Management', count: users.length },
                            { id: 'AGENCIES', label: 'Agency Management', count: agencies.length },
                            { id: 'BOOKINGS', label: 'Booking Management', count: bookings.length },
                            { id: 'CARS', label: 'Car Inventory', count: cars.length },
                            { id: 'BIDS', label: 'Bids Management', count: bids.length },
                            { id: 'REPORTS', label: 'Reports & Analytics', count: null }
                        ].map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: isSelected ? '600' : '500',
                                        fontSize: '0.875rem',
                                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                        color: isSelected ? '#2563eb' : '#475569',
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <span>{tab.label}</span>
                                    {tab.count !== null && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '12px',
                                            backgroundColor: isSelected ? '#2563eb' : '#f1f5f9',
                                            color: isSelected ? '#ffffff' : '#64748b',
                                            fontWeight: 'bold'
                                        }}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* COLUMN 2: Active Management View */}
                <div style={cardStyle}>
                    {error && <div style={{ padding: '0.75rem 1rem', color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                    {isLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading details...</div>
                    ) : (
                        <>
                            {/* 1. USER MANAGEMENT */}
                            {activeTab === 'USERS' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>User Directory</h3>
                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            {['ALL', 'CUSTOMER', 'AGENCY', 'OWNER', 'ADMIN'].map(role => (
                                                <button key={role} onClick={() => setUserRoleFilter(role)} style={filterTabStyle(userRoleFilter === role)}>
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>ID</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Email Address</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Role</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Status</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No user records match the selected filter.</td></tr>
                                            ) : (
                                                filteredUsers.map(u => (
                                                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.875rem' }}>#{u.id}</td>
                                                        <td style={{ padding: '0.75rem', fontWeight: '500', color: '#1e293b', fontSize: '0.875rem' }}>{u.email}</td>
                                                        <td style={{ padding: '0.75rem' }}><span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#f1f5f9', color: '#334155' }}>{u.role}</span></td>
                                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: '500' }}>
                                                            <select value={u.status || 'ACTIVE'} onChange={(event) => handleUpdateUserStatus(u.id, event.target.value)} style={{ color: u.status === 'ACTIVE' ? '#16a34a' : '#dc2626', border: 'none', background: 'transparent', fontWeight: 600 }}>
                                                                {['ACTIVE', 'SUSPENDED', 'BLOCKED'].map(status => <option key={status} value={status}>{status}</option>)}
                                                            </select>
                                                        </td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                                                <button onClick={() => setActiveModal({ type: 'VIEW', data: u })} style={actionBtnStyle('#e2e8f0', '#334155')}>View</button>
                                                                <button onClick={() => setActiveModal({ type: 'EDIT', data: { ...u } })} style={actionBtnStyle('#dbeafe', '#1d4ed8')}>Edit</button>
                                                                <button onClick={() => handleDeleteItem(u.id, 'USERS')} style={actionBtnStyle('#fee2e2', '#b91c1c')}>Delete</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 2. AGENCY MANAGEMENT */}
                            {activeTab === 'AGENCIES' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Agency Directory</h3>
                                        <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE'].map(status => <option key={status} value={status}>{status}</option>)}
                                        </select>
                                    </div>
                                    <form onSubmit={handleFindAgency} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <input type="number" min="1" value={agencyId} onChange={(event) => setAgencyId(event.target.value)} placeholder="Agency ID" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                        <button type="submit" style={actionBtnStyle('#2563eb', '#ffffff')}>Find Agency</button>
                                    </form>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead><tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>ID</th>
                                            <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Name</th>
                                            <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Email</th>
                                            <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                                        </tr></thead>
                                        <tbody>{filteredAgencies.length === 0 ? (
                                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Enter an agency ID to load a record.</td></tr>
                                        ) : filteredAgencies.map(agency => (
                                            <tr key={agency.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem' }}>#{agency.id}</td>
                                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{agency.name || agency.agencyName || '-'}</td>
                                                <td style={{ padding: '0.75rem' }}>{agency.email || '-'}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}><div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setActiveModal({ type: 'VIEW', data: agency })} style={actionBtnStyle('#e2e8f0', '#334155')}>View</button>
                                                    <button onClick={() => setActiveModal({ type: 'EDIT', data: { ...agency } })} style={actionBtnStyle('#dbeafe', '#1d4ed8')}>Edit</button>
                                                    <button onClick={() => handleDeleteItem(agency.id, 'AGENCIES')} style={actionBtnStyle('#fee2e2', '#b91c1c')}>Delete</button>
                                                </div></td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            )}

                            {/* 3. AVAILABLE CARS */}
                            {activeTab === 'CARS' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Car Inventory</h3>
                                            <button onClick={() => { setEditingCar(null); setIsCarModalOpen(true); }} style={actionBtnStyle('#2563eb', '#ffffff')}>Add Car</button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            {['ALL', 'SEDAN', 'SUV', 'HATCHBACK', 'LUXURY'].map(cat => <button key={cat} onClick={() => setVehicleCategoryFilter(cat)} style={filterTabStyle(vehicleCategoryFilter === cat)}>{cat}</button>)}
                                        </div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>ID</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Vehicle Model</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Reg No</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Rate/Day</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Status</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCars.length === 0 ? (
                                                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No available cars match the filter.</td></tr>
                                            ) : (
                                                filteredCars.map(f => (
                                                    <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.875rem' }}>#{f.id}</td>
                                                        <td style={{ padding: '0.75rem', fontWeight: '500', color: '#1e293b', fontSize: '0.875rem' }}>{f.brand} {f.model}</td>
                                                        <td style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>{f.registrationNo || '-'}</td>
                                                        <td style={{ padding: '0.75rem', fontWeight: '500', fontSize: '0.875rem' }}>₹{f.dailyRate || '-'}</td>
                                                        <td style={{ padding: '0.75rem', color: f.isAvailable ? '#16a34a' : '#b45309', fontSize: '0.85rem', fontWeight: '500' }}>{f.isAvailable ? 'Available' : 'Unavailable'}</td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                                                <button onClick={() => setActiveModal({ type: 'VIEW', data: f })} style={actionBtnStyle('#e2e8f0', '#334155')}>View</button>
                                                                <button onClick={() => setEditingCar(f)} style={actionBtnStyle('#dbeafe', '#1d4ed8')}>Edit</button>
                                                                <button onClick={async () => {
                                                                    try {
                                                                        await fleetApi.toggleAvailabilityAsAdmin(f.id, false);
                                                                        setCars(cars.filter(car => car.id !== f.id));
                                                                    } catch (err) {
                                                                        alert('Failed to update car availability.');
                                                                    }
                                                                }} style={actionBtnStyle('#dbeafe', '#1d4ed8')}>Disable</button>
                                                                <button onClick={() => handleDeleteItem(f.id, 'CARS')} style={actionBtnStyle('#fee2e2', '#b91c1c')}>Delete</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 3. BOOKING MANAGEMENT */}
                            {activeTab === 'BOOKINGS' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Booking Management</h3>
                                            <select value={bookingStatusFilter} onChange={(event) => setBookingStatusFilter(event.target.value)} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                                                {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map(status => <option key={status} value={status}>{status}</option>)}
                                            </select>
                                        </div>
                                        <form onSubmit={handleFindBooking} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="number" min="1" value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder="Booking ID" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                            <button type="submit" style={actionBtnStyle('#2563eb', '#ffffff')}>Find Booking</button>
                                        </form>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Booking ID</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Customer</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Car ID</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Amount</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Status</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBookings.length === 0 ? (
                                                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No booking records found.</td></tr>
                                            ) : (
                                                filteredBookings.map(b => (
                                                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.875rem' }}>#{b.id}</td>
                                                        <td style={{ padding: '0.75rem', fontWeight: '500', fontSize: '0.875rem' }}>{b.customerEmail}</td>
                                                        <td style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>#{b.carId}</td>
                                                        <td style={{ padding: '0.75rem', fontWeight: '500', fontSize: '0.875rem' }}>₹{b.totalAmount}</td>
                                                        <td style={{ padding: '0.75rem' }}>
                                                            <select value={b.status || 'PENDING'} onChange={(event) => handleUpdateBookingStatus(b.id, event.target.value)} style={{ padding: '0.25rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 600 }}>
                                                                {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map(status => <option key={status} value={status}>{status}</option>)}
                                                            </select>
                                                        </td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                                                <button onClick={() => setActiveModal({ type: 'VIEW', data: b })} style={actionBtnStyle('#e2e8f0', '#334155')}>View</button>
                                                                {b.status !== 'CANCELLED' && <button onClick={() => handleCancelBooking(b.id)} style={actionBtnStyle('#fee2e2', '#b91c1c')}>Cancel</button>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 5. BIDS MANAGEMENT */}
                            {activeTab === 'BIDS' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Marketplace Bids</h3>
                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map(status => (
                                                <button key={status} onClick={() => setBidStatusFilter(status)} style={filterTabStyle(bidStatusFilter === status)}>
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Bid ID</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Bidder</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Offer Price</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>Status</th>
                                                <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBids.length === 0 ? (
                                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No bids found for this status.</td></tr>
                                            ) : (
                                                filteredBids.map(b => (
                                                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.875rem' }}>#{b.id}</td>
                                                        <td style={{ padding: '0.75rem', fontWeight: '500', fontSize: '0.875rem' }}>{b.bidderEmail || `User #${b.userId}`}</td>
                                                        <td style={{ padding: '0.75rem', fontWeight: '500', fontSize: '0.875rem' }}>₹{b.amount}</td>
                                                        <td style={{ padding: '0.75rem' }}>
                                                            <span style={{
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: '4px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold',
                                                                backgroundColor: b.status === 'ACCEPTED' ? '#dcfce7' : b.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                                                color: b.status === 'ACCEPTED' ? '#15803d' : b.status === 'REJECTED' ? '#b91c1c' : '#b45309'
                                                            }}>
                                                                {b.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                                                <button onClick={() => setActiveModal({ type: 'VIEW', data: b })} style={actionBtnStyle('#e2e8f0', '#334155')}>View</button>
                                                                {b.status === 'PENDING' && (
                                                                    <>
                                                                        <button onClick={() => handleUpdateBidStatus(b.id, 'ACCEPTED')} style={actionBtnStyle('#16a34a', '#fff')}>Accept</button>
                                                                        <button onClick={() => handleUpdateBidStatus(b.id, 'REJECTED')} style={actionBtnStyle('#dc2626', '#fff')}>Reject</button>
                                                                    </>
                                                                )}
                                                                <button onClick={() => handleDeleteItem(b.id, 'BIDS')} style={actionBtnStyle('#fee2e2', '#b91c1c')}>Delete</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 6. REPORTS & ANALYTICS */}
                            {activeTab === 'REPORTS' && (
                                <ReportsManager />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* --- ACTION MODAL DIALOG (VIEW & EDIT) --- */}
            {activeModal.type && activeModal.data && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a' }}>{activeModal.type === 'VIEW' ? 'View Details' : 'Edit Information'}</h4>
                            <button onClick={() => setActiveModal({ type: null, data: null })} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                        </div>

                        {activeModal.type === 'VIEW' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                                {getViewEntries(activeModal.data, activeTab).map((key) => (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.25rem' }}>
                                        <span style={{ color: '#64748b', fontWeight: '500' }}>{formatDetailLabel(key)}:</span>
                                        <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right', maxWidth: '60%', overflowWrap: 'anywhere' }}>
                                            {formatDetailValue(activeModal.data[key])}
                                        </span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button onClick={() => setActiveModal({ type: null, data: null })} style={actionBtnStyle('#cbd5e1', '#0f172a')}>Close</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Object.entries(activeModal.data).map(([key, value]) => {
                                    if (key === 'id') return null; // Read-only ID
                                    return (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>{key.toUpperCase()}</label>
                                            <input
                                                type="text"
                                                value={value || ''}
                                                onChange={(e) => setActiveModal({ ...activeModal, data: { ...activeModal.data, [key]: e.target.value } })}
                                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.875rem' }}
                                            />
                                        </div>
                                    );
                                })}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setActiveModal({ type: null, data: null })} style={actionBtnStyle('#e2e8f0', '#475569')}>Cancel</button>
                                    <button type="submit" style={actionBtnStyle('#2563eb', '#ffffff')}>Save Changes</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <VehicleModal
                isOpen={Boolean(editingCar) || isCarModalOpen}
                initialData={editingCar}
                onClose={() => { setEditingCar(null); setIsCarModalOpen(false); }}
                onSubmit={handleUpdateCar}
            />
        </div>
    );
};

export default AdminView;