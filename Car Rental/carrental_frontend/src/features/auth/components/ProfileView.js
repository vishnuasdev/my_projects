import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchProfileByRole, updateProfileByRole } from '../api/profileApi';
import Spinner from '../../../components/feedback/Spinner';

const ProfileView = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [loadError, setLoadError] = useState('');
    
    const [dbProfile, setDbProfile] = useState({});
    
    const [form, setForm] = useState({
        name: '',
        phone: '',
        dob: '',
        licenseNo: '',
        location: '',
        address: {
            doorNo: '',
            street: '',
            area: '',
            city: '',
            state: '',
            pincode: '',
            landmark: ''
        }
    });

    const rawRole = user?.role || user?.roles || '';
    const userRoles = Array.isArray(rawRole) ? rawRole : [rawRole];
    const userRole = String(userRoles[0] || 'USER').toUpperCase().replace('ROLE_', '');
    const profileApiAvailable = ['OWNER', 'AGENCY', 'CUSTOMER'].includes(userRole);
    const customerProfileIdAvailable = userRole !== 'CUSTOMER' || Boolean(user?.profileId || user?.customerId || user?.id);

    const getDashboardPath = () => {
        if (userRole === 'CUSTOMER') return '/customer/dashboard';
        if (userRole === 'AGENCY') return '/agency/dashboard';
        if (userRole === 'OWNER') return '/owner/dashboard';
        if (userRole === 'ADMIN') return '/admin/dashboard';
        return '/';
    };

    const handleCancel = () => navigate(getDashboardPath());

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError('');
            if (!profileApiAvailable || !customerProfileIdAvailable) {
                setDbProfile(user || {});
                setForm(prev => ({
                    ...prev,
                    name: user?.name || user?.fullName || '',
                    phone: user?.phone || user?.mobile || '',
                    location: user?.location || ''
                }));
                return;
            }
            const data = await fetchProfileByRole(userRole, user) || {};

            setDbProfile(data);
            setForm({
                name: data.name || data.agencyName || data.fullName || '',
                phone: data.phone || data.mobile || data.contactNumber || '',
                dob: data.dob || '',
                licenseNo: data.licenseNo || '',
                location: data.location || '',
                address: {
                    doorNo: data.address?.doorNo || '',
                    street: data.address?.street || '',
                    area: data.address?.area || '',
                    city: data.address?.city || '',
                    state: data.address?.state || '',
                    pincode: data.address?.pincode || '',
                    landmark: data.address?.landmark || ''
                }
            });
        } catch (err) {
            console.error("Error fetching profile details:", err);
            setLoadError(err.message || 'Unable to load profile details.');
        } finally {
            setLoading(false);
        }
    }, [customerProfileIdAvailable, profileApiAvailable, user, userRole]);

    useEffect(() => {
        if (userRole) {
            fetchProfile();
        }
    }, [userRole, fetchProfile]);

    const handleChange = (e) => {
        if (!profileApiAvailable || !customerProfileIdAvailable) return;
        const { name, value } = e.target;
        if (name.startsWith('addr_')) {
            const field = name.replace('addr_', '');
            setForm(prev => ({ 
                ...prev, 
                address: { 
                    ...prev.address, 
                    [field]: value 
                } 
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profileApiAvailable || !customerProfileIdAvailable) return;

        if (userRole === 'AGENCY' && (!form.name.trim() || !form.location.trim() || !form.address.street.trim() || !form.address.city.trim() || !form.address.state.trim())) {
            setSaveError('Agency name, location, street, city, and state are required.');
            return;
        }

        if (userRole === 'CUSTOMER' && (!form.name.trim() || !form.licenseNo.trim() || !form.dob.trim())) {
            setSaveError('Full name, Date of Birth, and Driving License Number are required.');
            return;
        }

        setSaving(true);
        setSaveError('');
        try {
            const updatedData = await updateProfileByRole(userRole, form, user) || {};
            setDbProfile(updatedData);
            updateUser({
                ...updatedData,
                name: updatedData.name || updatedData.agencyName || updatedData.fullName || form.name,
                phone: updatedData.phone || updatedData.mobile || form.phone
            });
            alert("Profile details saved successfully!");
        } catch (err) {
            console.error("Save error:", err);
            setSaveError(err.response?.data?.message || err.response?.data?.error || "Failed to update profile details.");
        } finally {
            setSaving(false);
        }
    };

    const isLocked = (val) => Boolean(val && String(val).trim().length > 0);

    const isFullyLocked = () => {
        const profileName = dbProfile.name || dbProfile.agencyName || dbProfile.fullName;
        
        if (!isLocked(dbProfile.location)) return false;
        if (userRole === 'CUSTOMER' && (!isLocked(profileName) || !isLocked(dbProfile.dob) || !isLocked(dbProfile.licenseNo))) return false;
        if (userRole === 'OWNER' && (!isLocked(profileName) || !isLocked(dbProfile.dob))) return false;
        if (userRole === 'AGENCY' && !isLocked(profileName)) return false;
        if (!isLocked(dbProfile.address?.doorNo) || !isLocked(dbProfile.address?.pincode)) return false;
        
        return true;
    };

    if (loading) return <Spinner />;

    return (
        <div className="profile-container">
            <style>{`
                .profile-container {
                    width: 100%;
                    min-height: calc(100vh - 64px);
                    background-color: #f8fafc;
                    padding: 2.5rem 1rem 4rem;
                    box-sizing: border-box;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                .profile-card {
                    width: 100%;
                    max-width: 760px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    padding: 2.25rem 2.5rem;
                    box-sizing: border-box;
                }

                .profile-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.25rem;
                    border-bottom: 1px solid #f1f5f9;
                }

                .profile-title-flex {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .close-button {
                    margin-left: auto;
                    width: 32px;
                    height: 32px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    background: #ffffff;
                    color: #475569;
                    font-size: 1.25rem;
                    line-height: 1;
                    cursor: pointer;
                }

                .close-button:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                .profile-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    line-height: 1;
                }

                .badge-warning {
                    background-color: #fef3c7;
                    color: #d97706;
                    border: 1px solid #fde68a;
                }

                .badge-success {
                    background-color: #d1fae5;
                    color: #059669;
                    border: 1px solid #a7f3d0;
                }

                .notice-text {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-top: 0.5rem;
                    margin-bottom: 0;
                }

                .profile-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                }

                .grid-3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.25rem;
                }

                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }

                .field-label {
                    font-size: 0.825rem;
                    font-weight: 600;
                    color: #334155;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .ui-input {
                    width: 100%;
                    height: 42px;
                    padding: 0 0.85rem;
                    background-color: #ffffff;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: #0f172a;
                    box-sizing: border-box;
                    transition: all 0.15s ease-in-out;
                    outline: none;
                }

                .ui-input::placeholder {
                    color: #94a3b8;
                }

                .ui-input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
                }

                .ui-input:disabled {
                    background-color: #f8fafc;
                    border-color: #e2e8f0;
                    color: #64748b;
                    cursor: not-allowed;
                }

                .section-header {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-top: 0.5rem;
                    padding-top: 1.25rem;
                    border-top: 1px solid #f1f5f9;
                }

                .lock-badge {
                    font-size: 0.725rem;
                    font-weight: 500;
                    color: #64748b;
                    background: #f1f5f9;
                    padding: 0.1rem 0.4rem;
                    border-radius: 4px;
                }

                .btn-row {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 0.75rem;
                    margin-top: 1rem;
                }

                .cancel-button {
                    background-color: #ffffff;
                    color: #475569;
                    font-weight: 600;
                    font-size: 0.9rem;
                    padding: 0.65rem 1.5rem;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                    cursor: pointer;
                }

                .cancel-button:hover {
                    background-color: #f8fafc;
                }

                .save-button {
                    background-color: #2563eb;
                    color: #ffffff;
                    font-weight: 600;
                    font-size: 0.9rem;
                    padding: 0.65rem 1.5rem;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    transition: background-color 0.2s ease, transform 0.1s ease;
                }

                .save-button:hover {
                    background-color: #1d4ed8;
                }

                .save-button:active {
                    transform: scale(0.98);
                }

                .save-button:disabled {
                    background-color: #93c5fd;
                    cursor: not-allowed;
                }

                @media (max-width: 640px) {
                    .profile-card {
                        padding: 1.5rem 1.25rem;
                    }

                    .grid-2, .grid-3 {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .btn-row button {
                        width: 100%;
                    }
                }
            `}</style>

            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-title-flex">
                        <h1 className="profile-title">{userRole} Profile</h1>
                        <span className={`badge ${isFullyLocked() ? 'badge-success' : 'badge-warning'}`}>
                            {isFullyLocked() ? 'Verified' : 'Action Required'}
                        </span>
                        <button type="button" className="close-button" onClick={handleCancel} aria-label="Close profile">
                            &times;
                        </button>
                    </div>
                    {loadError && (
                        <div role="alert" style={{ color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                            {loadError}
                        </div>
                    )}
                    <p className="notice-text">
                        {profileApiAvailable && customerProfileIdAvailable
                            ? (isFullyLocked()
                                ? 'Details are saved to the database and locked for security.'
                                : 'Details submitted to the database cannot be changed later.')
                            : 'Complete your profile details and save them to the database.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    {saveError && (
                        <div role="alert" style={{ color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                            {saveError}
                        </div>
                    )}
                    <fieldset disabled={!profileApiAvailable} style={{ border: 0, padding: 0, margin: 0, display: 'contents' }}>

                    {/* Top Row: Email & Primary Location */}
                    <div className="grid-2">
                        <div className="field-group">
                            <label className="field-label">Account Email</label>
                            <input
                                className="ui-input"
                                value={user?.email || ''}
                                disabled
                                readOnly
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label">
                                Primary Location / City
                                {isLocked(dbProfile.location) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input
                                className="ui-input"
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.location)}
                                placeholder="e.g. Chennai"
                            />
                        </div>
                    </div>

                    {/* Contact Number & Full Name Row */}
                    <div className="grid-2">
                        <div className="field-group">
                            <label className="field-label">
                                {userRole === 'AGENCY' ? 'Agency Name' : 'Full Name'}
                                {isLocked(dbProfile.name || dbProfile.agencyName || dbProfile.fullName) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input
                                className="ui-input"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.name || dbProfile.agencyName || dbProfile.fullName)}
                                placeholder={userRole === 'AGENCY' ? 'Enter agency name' : 'Enter full name'}
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label">
                                Phone Number
                                {isLocked(dbProfile.phone || dbProfile.mobile) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input
                                className="ui-input"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.phone || dbProfile.mobile)}
                                placeholder="e.g. +91 9876543210"
                            />
                        </div>
                    </div>

                    {/* Secondary Information: DOB & Driving License */}
                    <div className="grid-2">
                        {(userRole === 'CUSTOMER' || userRole === 'OWNER') && (
                            <div className="field-group">
                                <label className="field-label">
                                    Date of Birth
                                    {isLocked(dbProfile.dob) && <span className="lock-badge">🔒 Locked</span>}
                                </label>
                                <input 
                                    type="date"
                                    className="ui-input"
                                    name="dob"
                                    value={form.dob}
                                    onChange={handleChange}
                                    disabled={isLocked(dbProfile.dob)}
                                />
                            </div>
                        )}

                        {userRole === 'CUSTOMER' && (
                            <div className="field-group">
                                <label className="field-label">
                                    Driving License Number
                                    {isLocked(dbProfile.licenseNo) && <span className="lock-badge">🔒 Locked</span>}
                                </label>
                                <input 
                                    className="ui-input"
                                    name="licenseNo"
                                    value={form.licenseNo}
                                    onChange={handleChange}
                                    disabled={isLocked(dbProfile.licenseNo)}
                                    placeholder="e.g. TN-0720230001234"
                                />
                            </div>
                        )}
                    </div>

                    {/* Address Section */}
                    <div className="section-header">Address Information</div>

                    <div className="grid-2">
                        <div className="field-group">
                            <label className="field-label">
                                Door / Flat No
                                {isLocked(dbProfile.address?.doorNo) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input 
                                className="ui-input"
                                name="addr_doorNo"
                                value={form.address.doorNo}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.address?.doorNo)}
                                placeholder="Door/Flat No"
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label">
                                Street
                                {isLocked(dbProfile.address?.street) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input 
                                className="ui-input"
                                name="addr_street"
                                value={form.address.street}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.address?.street)}
                                placeholder="Street name"
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="field-group">
                            <label className="field-label">
                                Area / Locality
                                {isLocked(dbProfile.address?.area) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input 
                                className="ui-input"
                                name="addr_area"
                                value={form.address.area}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.address?.area)}
                                placeholder="Area"
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label">
                                Landmark
                                {isLocked(dbProfile.address?.landmark) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input 
                                className="ui-input"
                                name="addr_landmark"
                                value={form.address.landmark}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.address?.landmark)}
                                placeholder="Nearby landmark"
                            />
                        </div>
                    </div>

                    <div className="grid-3">
                        <div className="field-group">
                            <label className="field-label">
                                City
                                {isLocked(dbProfile.address?.city) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input 
                                className="ui-input"
                                name="addr_city"
                                value={form.address.city}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.address?.city)}
                                placeholder="City"
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label">
                                State
                                {isLocked(dbProfile.address?.state) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input 
                                className="ui-input"
                                name="addr_state"
                                value={form.address.state}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.address?.state)}
                                placeholder="State"
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label">
                                Pincode
                                {isLocked(dbProfile.address?.pincode) && <span className="lock-badge">🔒 Locked</span>}
                            </label>
                            <input 
                                className="ui-input"
                                name="addr_pincode"
                                value={form.address.pincode}
                                onChange={handleChange}
                                disabled={isLocked(dbProfile.address?.pincode)}
                                placeholder="Pincode"
                            />
                        </div>
                    </div>

                    </fieldset>

                    <div className="btn-row">
                        <button type="button" className="cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                        {profileApiAvailable && !isFullyLocked() && (
                            <button type="submit" className="save-button" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileView;