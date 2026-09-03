import React, { useState, useEffect } from 'react';
import { fleetApi } from '../fleet/api/fleetApi';
import VehicleCard from '../fleet/components/VehicleCard';
import VehicleModal from '../fleet/components/VehicleModal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/feedback/Spinner';
import { ownerApi } from '../auth/api/ownerApi';

const OwnerView = () => {
    const [activeTab, setActiveTab] = useState('VEHICLES'); // 'VEHICLES' | 'BIDS' | 'CALLBACKS'
    const [myVehicles, setMyVehicles] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [myBids, setMyBids] = useState([]);
    const [callbacks, setCallbacks] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Modal Management
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);

    // Bid & Callback Form States
    const [selectedVehicleForBid, setSelectedVehicleForBid] = useState('');
    const [selectedAgencyForBid, setSelectedAgencyForBid] = useState('');
    const [bidAmount, setBidAmount] = useState('');

    const [callbackAgency, setCallbackAgency] = useState('');
    const [callbackNote, setCallbackNote] = useState('');

    const fetchOwnerData = async () => {
        setLoading(true);
        setError('');
        const vehiclesResult = await Promise.allSettled([fleetApi.getMyVehicles()]);
        const vehicles = vehiclesResult[0];
        const vehicleList = vehicles.status === 'fulfilled' ? vehicles.value || [] : [];
        const bidResults = await Promise.allSettled(vehicleList.map(vehicle => ownerApi.getBidsByCar(vehicle.id)));

        if (vehicles.status === 'fulfilled') setMyVehicles(vehicles.value || []);
        setMyBids(bidResults.filter(result => result.status === 'fulfilled').flatMap(result => result.value || []));
        setAgencies([]);
        setCallbacks([]);

        const failedRequests = [vehicles, ...bidResults].filter(result => result.status === 'rejected');
        if (failedRequests.length > 0) {
            console.error('Some owner dashboard requests failed:', failedRequests);
            setError(`${failedRequests.length} dashboard service${failedRequests.length > 1 ? 's' : ''} unavailable. Try again.`);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOwnerData();
    }, []);

    // Vehicle Handlers
    const handleAddVehicle = async (vehicleData, images) => {
        try {
            await fleetApi.createVehicle(vehicleData, images);
            setIsAddModalOpen(false);
            fetchOwnerData();
        } catch (err) {
            alert('Failed to host new vehicle.');
        }
    };

    const handleUpdateVehicle = async (vehicleData, images) => {
        try {
            await fleetApi.updateVehicle(editingVehicle.id, vehicleData, images);
            setEditingVehicle(null);
            fetchOwnerData();
        } catch (err) {
            alert('Failed to update vehicle details.');
        }
    };

    const handleToggleAvailability = async (vehicle) => {
        try {
            await fleetApi.toggleAvailability(vehicle.id, !vehicle.isAvailable);
            fetchOwnerData();
        } catch (err) {
            alert('Failed to update vehicle availability.');
        }
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!window.confirm('Delete this vehicle?')) return;
        try {
            await fleetApi.deleteVehicle(vehicleId);
            fetchOwnerData();
        } catch (err) {
            alert('Failed to delete vehicle.');
        }
    };

    // Marketplace Bid Submission
    const handlePlaceBid = async (e) => {
        e.preventDefault();
        if (!selectedVehicleForBid || !selectedAgencyForBid || !bidAmount) {
            alert('Please complete all bid parameters.');
            return;
        }
        try {
            await ownerApi.placeBid({
                carId: selectedVehicleForBid,
                agencyId: selectedAgencyForBid,
                ratePerDay: parseFloat(bidAmount),
                status: 'PENDING'
            });
            alert('Bid submitted successfully to the selected agency!');
            setBidAmount('');
            setSelectedVehicleForBid('');
            setSelectedAgencyForBid('');
            fetchOwnerData();
        } catch (err) {
            alert('Failed to submit bid.');
        }
    };

    // Callback Request Submission
    const handleRequestCallback = async (e) => {
        e.preventDefault();
        if (!callbackAgency) {
            alert('Please select an agency.');
            return;
        }
        alert('Callback requests are not available in the supplied owner controller.');
    };

    if (loading) return <Spinner size="lg" />;

    const acceptedBids = myBids.filter(b => b.status === 'ACCEPTED');

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
                @media (max-width: 700px) {
                    .owner-dashboard { padding: 1.25rem 1rem 3rem !important; }
                    .owner-dashboard .dashboard-header { align-items: flex-start !important; flex-direction: column; }
                    .owner-dashboard .dashboard-header button { width: 100%; }
                    .owner-dashboard .dashboard-error { align-items: flex-start; flex-direction: column; }
                    .owner-dashboard .dashboard-workspace { grid-template-columns: 1fr !important; }
                }
            `}</style>
            {/* Header Area */}
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <div>
                    <h2 className="dashboard-heading" style={{ margin: 0, color: '#0f172a' }}>Vehicle Owner Dashboard</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        Manage hosted vehicles, handle agency bids, and request support.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>+ Host a Vehicle</Button>
            </div>

            {error && <div className="dashboard-error" style={{ padding: '0.8rem 1rem', backgroundColor: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}><span>{error}</span><button className="dashboard-retry" onClick={fetchOwnerData}>Retry</button></div>}

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
            <div className="dashboard-tabs" style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
                {[
                    { id: 'VEHICLES', label: `My Hosted Fleet (${myVehicles.length})` },
                    { id: 'BIDS', label: `Agency Bids (${myBids.length})` },
                    { id: 'CALLBACKS', label: 'Agency Callbacks' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {myVehicles.map((vehicle) => (
                                <div key={vehicle.id} className="dashboard-surface" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
                                    <VehicleCard car={vehicle} actionLabel="Owner Item" isOwner={true} />
                                    <div style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setEditingVehicle(vehicle)}
                                            style={{ padding: '0.35rem 0.75rem', backgroundColor: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                                        >
                                            Edit Vehicle Info
                                        </button>
                                        <button
                                            onClick={() => handleToggleAvailability(vehicle)}
                                            style={{ marginLeft: '0.5rem', padding: '0.35rem 0.75rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                                        >
                                            {vehicle.isAvailable ? 'Mark Unavailable' : 'Make Available'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteVehicle(vehicle.id)}
                                            style={{ marginLeft: '0.5rem', padding: '0.35rem 0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
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
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Select Vehicle</label>
                            <select
                                value={selectedVehicleForBid}
                                onChange={(e) => setSelectedVehicleForBid(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                            >
                                <option value="">Select your car</option>
                                {myVehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.brand || v.make} {v.model} (#{v.id})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Target Agency</label>
                            <select
                                value={selectedAgencyForBid}
                                onChange={(e) => setSelectedAgencyForBid(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                            >
                                <option value="">Select agency</option>
                                {agencies.map(a => (
                                    <option key={a.id} value={a.id}>{a.name || a.agencyName || `Agency #${a.id}`}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Daily Rate Bid (₹)</label>
                            <input
                                type="number"
                                placeholder="Enter daily rate bid"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                            />
                        </div>

                        <Button type="submit" variant="primary" style={{ width: '100%' }}>Submit Bid</Button>
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

            {/* TAB 3: CALLBACK REQUESTS */}
            {activeTab === 'CALLBACKS' && (
                <div className="dashboard-workspace" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Form: Request Callback */}
                    <form onSubmit={handleRequestCallback} className="dashboard-surface" style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Request Agency Callback</h4>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Select Agency</label>
                            <select
                                value={callbackAgency}
                                onChange={(e) => setCallbackAgency(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                            >
                                <option value="">Choose agency</option>
                                {agencies.map(a => (
                                    <option key={a.id} value={a.id}>{a.name || a.agencyName || `Agency #${a.id}`}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Message / Notes</label>
                            <textarea
                                rows="3"
                                placeholder="State reason for callback request..."
                                value={callbackNote}
                                onChange={(e) => setCallbackNote(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
                            />
                        </div>

                        <Button type="submit" variant="primary" style={{ width: '100%' }}>Send Callback Request</Button>
                    </form>

                    {/* Callback Request Log */}
                    <div className="dashboard-surface" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: 0, color: '#0f172a' }}>Callback Request History</h4>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Req ID</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Agency</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Note</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {callbacks.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                                No callback requests made.
                                            </td>
                                        </tr>
                                    ) : (
                                        callbacks.map(c => (
                                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#334155', fontWeight: '500' }}>#{c.id}</td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#334155' }}>
                                                    {c.agency ? (c.agency.name || c.agency.agencyName || `Agency #${c.agency.id}`) : `Agency #${c.agencyId || 'N/A'}`}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.note || 'N/A'}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.6rem',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        display: 'inline-block',
                                                        backgroundColor: c.status === 'COMPLETED' ? '#dcfce7' : c.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                                                        color: c.status === 'COMPLETED' ? '#15803d' : c.status === 'CANCELLED' ? '#b91c1c' : '#b45309'
                                                    }}>
                                                        {c.status}
                                                    </span>
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

            {/* Modal for Registering / Editing Vehicles */}
            <VehicleModal
                isOpen={isAddModalOpen || Boolean(editingVehicle)}
                initialData={editingVehicle}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingVehicle(null);
                }}
                onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle}
            />
        </div>
    );
};

export default OwnerView;