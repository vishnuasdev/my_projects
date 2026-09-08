import React, { useState, useEffect, useCallback } from 'react';
import { fleetApi } from '../fleet/api/fleetApi';
import VehicleCard from '../fleet/components/VehicleCard';
import VehicleModal from '../fleet/components/VehicleModal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/feedback/Spinner';
import { ownerApi } from '../auth/api/ownerApi';

const getRequestErrorMessage = (error, fallback) => {
    const responseData = error.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) return responseData;
    if (responseData?.message) return responseData.message;
    if (responseData?.error) return responseData.error;
    return `${fallback}${error.response?.status ? ` (${error.response.status})` : '.'}`;
};

const OwnerView = () => {
    const [activeTab, setActiveTab] = useState('VEHICLES'); // 'VEHICLES' | 'BIDS' | 'PROFILE'
    const [myVehicles, setMyVehicles] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [myBids, setMyBids] = useState([]);
    const [profile, setProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({ name: '' });
    const [profileImage, setProfileImage] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
    
    // Modal Management
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);

    // Bid form state
    const [selectedVehicleForBid, setSelectedVehicleForBid] = useState('');
    const [selectedAgencyForBid, setSelectedAgencyForBid] = useState('');
    const [agencySearch, setAgencySearch] = useState('');
    const [bidToAllAgencies, setBidToAllAgencies] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [submittingBid, setSubmittingBid] = useState(false);

    const showNotification = (type, text) => {
        setActionMessage({ type, text });
        setTimeout(() => setActionMessage({ type: '', text: '' }), 5000);
    };

    const fetchOwnerData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [vehiclesResult, agenciesResult, profileResult] = await Promise.allSettled([
                fleetApi.getMyVehicles(),
                ownerApi.getAgencies(),
                ownerApi.getProfile(),
            ]);

            const vehicleList = vehiclesResult.status === 'fulfilled' ? (vehiclesResult.value || []) : [];
            if (vehiclesResult.status === 'fulfilled') setMyVehicles(vehicleList);
            if (agenciesResult.status === 'fulfilled') setAgencies(agenciesResult.value || []);
            if (profileResult.status === 'fulfilled') {
                setProfile(profileResult.value || null);
                setProfileForm({ name: profileResult.value?.name || '' });
            }

            // Fetch bids using single endpoint if available, or fall back safely without triggering auth ejects
            try {
                if (ownerApi.getMyBids) {
                    const bids = await ownerApi.getMyBids();
                    setMyBids(bids || []);
                } else {
                    const bidResults = await Promise.allSettled(
                        vehicleList.map(vehicle => ownerApi.getBidsByCar(vehicle.id))
                    );
                    setMyBids(bidResults.filter(r => r.status === 'fulfilled').flatMap(r => r.value || []));
                }
            } catch (bidErr) {
                console.warn('Could not fetch bids directly:', bidErr);
            }

            const failedCount = [vehiclesResult, agenciesResult, profileResult].filter(r => r.status === 'rejected').length;
            if (failedCount > 0) {
                setError(`${failedCount} dashboard component(s) temporarily unavailable. Operating in persistent mode.`);
            }
        } catch (err) {
            console.error('Data fetch handled in-place:', err);
            setError('Unable to refresh all records. Session remains active.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOwnerData();
    }, [fetchOwnerData]);

    // Vehicle Handlers - In-place operations
    const handleAddVehicle = async (vehicleData, images) => {
        try {
            const created = await fleetApi.createVehicle(vehicleData, images);
            setIsAddModalOpen(false);
            if (created) {
                setMyVehicles(prev => [...prev, created]);
            } else {
                await fetchOwnerData();
            }
            showNotification('success', 'Vehicle hosted successfully.');
        } catch (err) {
            showNotification('error', getRequestErrorMessage(err, 'Failed to host new vehicle'));
            throw err;
        }
    };

    const handleUpdateVehicle = async (vehicleData, images) => {
        try {
            const updated = await fleetApi.updateVehicle(editingVehicle.id, vehicleData, images);
            setEditingVehicle(null);
            if (updated) {
                setMyVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
            } else {
                await fetchOwnerData();
            }
            showNotification('success', 'Vehicle details updated successfully.');
        } catch (err) {
            showNotification('error', getRequestErrorMessage(err, 'Failed to update vehicle details'));
            throw err;
        }
    };

    const handleDeleteVehicleImage = async (vehicleId, imageIndex) => {
        const updated = await fleetApi.deleteVehicleImage(vehicleId, imageIndex);
        setMyVehicles(prev => prev.map(vehicle => vehicle.id === vehicleId ? updated : vehicle));
        setEditingVehicle(updated);
        showNotification('success', 'Vehicle image deleted.');
    };

    const handleToggleAvailability = async (vehicle) => {
        const nextState = !vehicle.isAvailable;
        // Optimistic UI Update
        setMyVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, isAvailable: nextState } : v));
        try {
            await fleetApi.toggleAvailability(vehicle.id, nextState);
            showNotification('success', `Vehicle is now ${nextState ? 'Available' : 'Unavailable'}.`);
        } catch (err) {
            // Revert state on error without route loss
            setMyVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, isAvailable: vehicle.isAvailable } : v));
            showNotification('error', 'Failed to update vehicle availability.');
        }
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!window.confirm('Delete this vehicle from your fleet?')) return;
        try {
            await fleetApi.deleteVehicle(vehicleId);
            setMyVehicles(prev => prev.filter(v => v.id !== vehicleId));
            showNotification('success', 'Vehicle removed from your fleet.');
        } catch (err) {
            showNotification('error', 'Failed to delete vehicle.');
        }
    };

    const handleRecallVehicle = async (vehicle) => {
        if (!window.confirm('Recall this vehicle from the assigned agency?')) return;
        try {
            const recalledVehicle = await ownerApi.recallCar(vehicle.id);
            setMyVehicles(prev => prev.map(current => current.id === vehicle.id
                ? (recalledVehicle || { ...current, agency: null, agencyId: null })
                : current));
            showNotification('success', 'Vehicle recalled from the agency.');
        } catch (err) {
            showNotification('error', getRequestErrorMessage(err, 'Failed to recall vehicle'));
        }
    };

    const handleCancelBid = async (bidId) => {
        if (!window.confirm('Cancel this pending bid?')) return;
        try {
            await ownerApi.cancelBid(bidId);
            setMyBids(prev => prev.map(bid => bid.id === bidId ? { ...bid, status: 'CANCELLED' } : bid));
            showNotification('success', 'Bid cancelled.');
        } catch (err) {
            showNotification('error', getRequestErrorMessage(err, 'Failed to cancel bid'));
        }
    };

    // Marketplace Bid Submission
    const handlePlaceBid = async (e) => {
        e.preventDefault();
        const parsedBidAmount = Number(bidAmount);
        if (!selectedVehicleForBid || !Number.isFinite(parsedBidAmount) || parsedBidAmount <= 0) {
            showNotification('error', 'Please select a vehicle and enter a daily rate.');
            return;
        }
        if (!bidToAllAgencies && !selectedAgencyForBid) {
            showNotification('error', 'Please select an agency or choose all agencies.');
            return;
        }
        if (bidToAllAgencies && agencies.length === 0) {
            showNotification('error', 'No agencies are available for bidding.');
            return;
        }
        setSubmittingBid(true);
        try {
            const targetAgencyIds = bidToAllAgencies
                ? agencies.map(agency => Number(agency.id)).filter(Number.isInteger)
                : [Number(selectedAgencyForBid)].filter(Number.isInteger);
            if (targetAgencyIds.length === 0) {
                showNotification('error', 'No valid agency was selected.');
                return;
            }
            const bidResults = await Promise.allSettled(
                targetAgencyIds.map(agencyId => ownerApi.placeBid({
                    carId: Number(selectedVehicleForBid),
                    agencyId,
                    ratePerDay: parsedBidAmount
                }))
            );
            const successfulBids = bidResults
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);
            const failedCount = bidResults.filter(result => result.status === 'rejected').length;
            const firstFailure = bidResults.find(result => result.status === 'rejected')?.reason;

            if (successfulBids.length > 0) {
                setMyBids(prev => [...successfulBids].reverse().concat(prev));
            } else {
                await fetchOwnerData();
            }
            if (failedCount > 0 && successfulBids.length > 0) {
                showNotification('error', `${successfulBids.length} bid(s) submitted, but ${failedCount} failed.`);
            } else if (successfulBids.length > 0) {
                showNotification('success', bidToAllAgencies
                    ? `Bid submitted successfully to all ${successfulBids.length} agencies.`
                    : 'Bid submitted successfully to the agency!');
            } else {
                showNotification('error', getRequestErrorMessage(
                    firstFailure || new Error('No bid request succeeded.'),
                    'The bid could not be submitted to any selected agency'
                ));
            }
            if (successfulBids.length > 0) {
                setBidAmount('');
                setSelectedVehicleForBid('');
                setSelectedAgencyForBid('');
                setAgencySearch('');
                setBidToAllAgencies(false);
            }
        } catch (err) {
            showNotification('error', getRequestErrorMessage(err, 'Failed to submit bid.'));
        } finally {
            setSubmittingBid(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfileForm(current => ({ ...current, [e.target.name]: e.target.value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const updated = await ownerApi.updateProfile({ ...profile, name: profileForm.name.trim() }, profileImage);
            setProfile(updated);
            setProfileImage(null);
            showNotification('success', 'Profile updated successfully.');
        } catch (err) {
            showNotification('error', getRequestErrorMessage(err, 'Failed to update profile.'));
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) return <Spinner size="lg" />;

    const acceptedBids = myBids.filter(b => b.status === 'ACCEPTED');
    const normalizedAgencySearch = agencySearch.trim().toLowerCase();
    const filteredAgencies = agencies.filter(agency => {
        const name = agency.name || agency.agencyName || agency.companyName || '';
        const email = agency.email || agency.user?.email || '';
        return `${name} ${email} ${agency.id}`.toLowerCase().includes(normalizedAgencySearch);
    });

    return (
        <div className="owner-dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <style>{`
                .owner-dashboard { color: #0f172a; }
                .owner-dashboard .dashboard-heading { letter-spacing: -0.025em; }
                .owner-dashboard .dashboard-error { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
                .owner-dashboard .dashboard-retry { border: 1px solid #fca5a5; border-radius: 6px; padding: 0.45rem 0.8rem; color: #991b1b; background: #fff; font-weight: 600; cursor: pointer; white-space: nowrap; }
                .owner-dashboard .dashboard-retry:hover { background: #fef2f2; }
                .owner-dashboard .dashboard-tabs { overflow-x: auto; scrollbar-width: thin; }
                .owner-dashboard .dashboard-tab { white-space: nowrap; }
                .owner-dashboard .dashboard-surface { box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04); }
                .owner-dashboard .dashboard-workspace { grid-template-columns: 320px minmax(0, 1fr) !important; }
                .owner-dashboard .dashboard-workspace > * { min-width: 0; }
                .owner-dashboard .dashboard-tab:focus-visible,
                .owner-dashboard button:focus-visible,
                .owner-dashboard input:focus-visible,
                .owner-dashboard select:focus-visible {
                    outline: 3px solid rgba(37, 99, 235, 0.35);
                    outline-offset: 2px;
                }
                .owner-dashboard .owner-vehicle-grid {
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
                    align-items: stretch;
                }
                .owner-dashboard .owner-vehicle-shell {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .owner-dashboard .owner-vehicle-shell .car-card {
                    flex: 1;
                    border-radius: 12px 12px 0 0 !important;
                }
                .owner-dashboard .owner-vehicle-shell .vehicle-image-container {
                    height: 150px !important;
                }
                .owner-dashboard .owner-vehicle-shell .car-details {
                    padding: 0.65rem !important;
                }
                .owner-dashboard .owner-vehicle-actions {
                    flex-wrap: wrap;
                    justify-content: flex-start !important;
                    min-height: 62px;
                    box-sizing: border-box;
                }
                @media (max-width: 700px) {
                    .owner-dashboard { padding: 1.25rem 1rem 3rem !important; }
                    .owner-dashboard .dashboard-header { align-items: flex-start !important; flex-direction: column; }
                    .owner-dashboard .dashboard-header button { width: 100%; }
                    .owner-dashboard .dashboard-error { align-items: flex-start; flex-direction: column; }
                    .owner-dashboard .dashboard-workspace { grid-template-columns: 1fr !important; }
                    .owner-dashboard .owner-vehicle-grid { grid-template-columns: minmax(0, 1fr) !important; }
                }
            `}</style>

            {/* Header Area */}
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <div>
                    <h2 className="dashboard-heading" style={{ margin: 0, color: '#0f172a' }}>Vehicle Owner Dashboard</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        Manage hosted vehicles, handle agency bids, and update your profile without interruption.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>+ Host a Vehicle</Button>
            </div>

            {/* In-App Action Notification Banner */}
            {actionMessage.text && (
                <div style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    backgroundColor: actionMessage.type === 'error' ? '#fff1f2' : '#f0fdf4',
                    color: actionMessage.type === 'error' ? '#b91c1c' : '#15803d',
                    border: `1px solid ${actionMessage.type === 'error' ? '#fecdd3' : '#bbf7d0'}`
                }} role="alert">
                    {actionMessage.text}
                </div>
            )}

            {error && (
                <div className="dashboard-error" style={{ padding: '0.8rem 1rem', backgroundColor: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    <span>{error}</span>
                    <button type="button" className="dashboard-retry" onClick={fetchOwnerData}>Retry</button>
                </div>
            )}

            {/* Status Notifications Panel */}
            {acceptedBids.length > 0 && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '0.95rem' }}>🎉 Agency Bid Acceptance Alerts</h4>
                    {acceptedBids.map(bid => (
                        <p key={bid.id} style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#15803d' }}>
                            Agency <strong>#{bid.agency?.id || bid.agencyId}</strong> has <strong>ACCEPTED</strong> your bid of ₹{bid.ratePerDay || bid.amount} for Vehicle #{bid.car?.id || bid.carId || bid.vehicleId}.
                        </p>
                    ))}
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="dashboard-tabs" role="tablist" style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
                {[
                    { id: 'VEHICLES', label: `My Hosted Fleet (${myVehicles.length})` },
                    { id: 'BIDS', label: `Agency Bids (${myBids.length})` },
                    { id: 'PROFILE', label: 'My Profile' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        aria-selected={activeTab === tab.id}
                        role="tab"
                        className="dashboard-tab"
                        style={{
                            padding: '0.6rem 1.2rem',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                            backgroundColor: 'transparent',
                            color: activeTab === tab.id ? '#2563eb' : '#64748b',
                            fontWeight: activeTab === tab.id ? '600' : '500',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: VEHICLES */}
            {activeTab === 'VEHICLES' && (
                <div>
                    {myVehicles.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <p style={{ color: '#64748b' }}>No vehicles registered under your account yet.</p>
                            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>Host Your First Vehicle</Button>
                        </div>
                    ) : (
                        <div className="owner-vehicle-grid" style={{ display: 'grid', gap: '1.5rem' }}>
                            {myVehicles.map((vehicle) => (
                                <div key={vehicle.id} className="owner-vehicle-shell dashboard-surface">
                                    <VehicleCard car={vehicle} actionLabel="Owner Item" isOwner={true} />
                                    <div className="owner-vehicle-actions" style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setEditingVehicle(vehicle)}
                                            style={{ padding: '0.35rem 0.75rem', backgroundColor: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                                        >
                                            Edit Info
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAvailability(vehicle)}
                                            style={{ padding: '0.35rem 0.75rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                                        >
                                            {vehicle.isAvailable ? 'Mark Unavailable' : 'Make Available'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteVehicle(vehicle.id)}
                                            style={{ padding: '0.35rem 0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                        {(vehicle.agencyId || vehicle.agency?.id) && (
                                            <button
                                                type="button"
                                                onClick={() => handleRecallVehicle(vehicle)}
                                                style={{ padding: '0.35rem 0.75rem', backgroundColor: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                                            >
                                                Recall
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: AGENCY BIDS */}
            {activeTab === 'BIDS' && (
                <div className="dashboard-workspace" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Form: Bid with Selected Agency */}
                    <form onSubmit={handlePlaceBid} className="dashboard-surface" style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Submit Bid to Agency</h4>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="owner-bid-vehicle" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Select Vehicle</label>
                            <select
                                id="owner-bid-vehicle"
                                value={selectedVehicleForBid}
                                onChange={(e) => setSelectedVehicleForBid(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                            >
                                <option value="">Select your car</option>
                                {myVehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.brand || v.make} {v.model} (#{v.id})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                                Target Agencies
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.65rem', fontSize: '0.8rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="bidTarget"
                                        checked={!bidToAllAgencies}
                                        onChange={() => setBidToAllAgencies(false)}
                                    />
                                    One agency
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="bidTarget"
                                        checked={bidToAllAgencies}
                                        onChange={() => {
                                            setBidToAllAgencies(true);
                                            setSelectedAgencyForBid('');
                                        }}
                                    />
                                    All agencies ({agencies.length})
                                </label>
                            </div>
                            {!bidToAllAgencies && (
                                <>
                                    <input
                                        type="search"
                                        value={agencySearch}
                                        onChange={(e) => setAgencySearch(e.target.value)}
                                        placeholder="Search agencies by name, email, or ID"
                                        aria-label="Search agencies"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                                    />
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff' }}>
                                        {filteredAgencies.length === 0 ? (
                                            <p style={{ margin: 0, padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>
                                                {agencies.length === 0 ? 'No agencies available.' : 'No agencies match your search.'}
                                            </p>
                                        ) : filteredAgencies.map(agency => {
                                            const agencyName = agency.name || agency.agencyName || agency.companyName || `Agency #${agency.id}`;
                                            const agencyEmail = agency.email || agency.user?.email;
                                            return (
                                                <label key={agency.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.65rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                                                    <input
                                                        type="radio"
                                                        name="selectedAgency"
                                                        value={agency.id}
                                                        checked={String(selectedAgencyForBid) === String(agency.id)}
                                                        onChange={() => setSelectedAgencyForBid(agency.id)}
                                                    />
                                                    <span style={{ minWidth: 0 }}>
                                                        <strong style={{ display: 'block', fontSize: '0.8rem', color: '#0f172a' }}>{agencyName}</strong>
                                                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{agencyEmail || `Agency #${agency.id}`}</span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                            {bidToAllAgencies && (
                                <p style={{ margin: 0, padding: '0.65rem', color: '#1d4ed8', backgroundColor: '#eff6ff', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    The same bid will be sent to all {agencies.length} listed agencies.
                                </p>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="owner-bid-amount" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Daily Rate Bid (₹)</label>
                            <input
                                id="owner-bid-amount"
                                type="number"
                                placeholder="Enter daily rate bid"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                min="0.01"
                                step="0.01"
                                required
                                aria-label="Daily rate bid in rupees"
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                            />
                        </div>

                        <Button type="submit" variant="primary" isLoading={submittingBid} style={{ width: '100%' }}>Submit Bid</Button>
                    </form>

                    {/* Table: My Bids Status */}
                    <div className="dashboard-surface" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: 0, color: '#0f172a' }}>My Submitted Bids</h4>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Bid ID</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Car Info</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Target Agency</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Rate / Day</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myBids.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                                No bids created yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        myBids.map(b => (
                                            <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#334155', fontWeight: '500' }}>#{b.id}</td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#334155' }}>
                                                    {b.car ? `${b.car.brand || ''} ${b.car.model || ''} (#${b.car.id})` : `Car #${b.carId || b.vehicleId || 'N/A'}`}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#334155' }}>
                                                    {b.agency ? (b.agency.name || b.agency.agencyName || `Agency #${b.agency.id}`) : `Agency #${b.agencyId || 'N/A'}`}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                                                    ₹{b.ratePerDay ?? b.amount ?? 0}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.6rem',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        display: 'inline-block',
                                                        backgroundColor: b.status === 'ACCEPTED' ? '#dcfce7' : b.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                                        color: b.status === 'ACCEPTED' ? '#15803d' : b.status === 'REJECTED' ? '#b91c1c' : '#b45309'
                                                    }}>
                                                        {b.status}
                                                    </span>
                                                    {String(b.status).toUpperCase() === 'PENDING' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelBid(b.id)}
                                                            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: PROFILE */}
            {activeTab === 'PROFILE' && (
                <form onSubmit={handleUpdateProfile} className="dashboard-surface" style={{ maxWidth: '620px', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.35rem', color: '#0f172a' }}>Owner Profile</h4>
                    <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.875rem' }}>Update the name and profile image associated with your owner account.</p>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="owner-name" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Name</label>
                        <input id="owner-name" name="name" value={profileForm.name} onChange={handleProfileChange} required style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="owner-image" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Profile image</label>
                        <input id="owner-image" type="file" accept="image/*" onChange={(e) => setProfileImage(e.target.files?.[0] || null)} />
                    </div>
                    {profile?.email && <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Email: {profile.email}</p>}
                    <Button type="submit" variant="primary" isLoading={savingProfile}>Save Profile</Button>
                </form>
            )}

            {/* Modal for Registering / Editing Vehicles */}
            <VehicleModal
                isOpen={isAddModalOpen || Boolean(editingVehicle)}
                initialData={editingVehicle}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingVehicle(null);
                }}
                onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle}
                onDeleteImage={handleDeleteVehicleImage}
            />
        </div>
    );
};

export default OwnerView;