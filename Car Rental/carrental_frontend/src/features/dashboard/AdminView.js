import React, { useState, useEffect, useRef } from 'react';
import ReportsManager from '../reports/components/ReportsManager';
import { fleetApi } from '../fleet/api/fleetApi';
import VehicleModal from '../fleet/components/VehicleModal';
import { adminApi } from '../admin/api/adminApi';

const formatDetailLabel = (key) => key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDetailValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return 'Not provided';
    }
    if (Array.isArray(value)) {
        return value.length ? `${value.length} item(s)` : 'None';
    }

    if (typeof value === 'object') {
        const address = [
            value.doorNo,
            value.street,
            value.area,
            value.city,
            value.state,
            value.pincode,
            value.landmark
        ].filter(Boolean);

        if (address.length) {
            return address.join(', ');
        }

        const name =
            value.name ||
            value.email ||
            value.brand ||
            value.model ||
            value.id;

        if (name) {
            return String(name);
        }

        return 'Details available';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return String(value);
};

const getViewEntries = (data, type) => {
    const preferredCarFields = [
        'id',
        'brand',
        'model',
        'registrationNo',
        'fuelType',
        'transmission',
        'dailyRate',
        'description',
        'isAvailable',
        'bidStatus',
        'agencyRemarks',
        'imageCount',
        'owner',
        'agency'
    ];

    const keys =
        type === 'CARS'
            ? preferredCarFields.filter((key) =>
                Object.prototype.hasOwnProperty.call(data, key)
            )
            : Object.keys(data);

    return keys.filter((key) =>
        !['images', 'available', 'password', 'confirmPassword'].includes(key)
        && !key.startsWith('__')
    );
};

const AdminView = () => {
    const [activeTab, setActiveTab] = useState('USERS');

    // Filters
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');
    const [agencyFilter, setAgencyFilter] = useState('ALL');
    const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
    const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState('ALL');
    const [bidStatusFilter, setBidStatusFilter] = useState('ALL');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Modal state
    const [activeModal, setActiveModal] = useState({
        type: null,
        data: null
    });

    const [editingCar, setEditingCar] = useState(null);
    const [isCarModalOpen, setIsCarModalOpen] = useState(false);

    // Data
    const [users, setUsers] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [cars, setCars] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [bids, setBids] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [owners, setOwners] = useState([]);
    const [summary, setSummary] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [systemLogs, setSystemLogs] = useState([]);
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [createUserForm, setCreateUserForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'CUSTOMER',
        status: 'ACTIVE'
    });
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const [bookingId, setBookingId] = useState('');
    const [agencyId, setAgencyId] = useState('');
    const refreshSequence = useRef(0);

    const getAdminProfileData = (user) => {
        const customer = customers.find(
            (item) => item.user?.id === user.id || item.email === user.email
        );
        const owner = owners.find(
            (item) => item.user?.id === user.id || item.email === user.email
        );
        const agency = agencies.find(
            (item) => item.user?.id === user.id || item.email === user.email
        );

        return {
            ...user,
            ...(customer
                ? {
                    profileType: 'Customer',
                    __customerId: customer.id,
                    dob: customer.dob,
                    licenseNo: customer.licenseNo,
                    location: customer.location,
                    address: customer.address
                }
                : {}),
            ...(owner
                ? {
                    profileType: 'Owner',
                    __ownerId: owner.id,
                    dob: owner.dob,
                    location: owner.location,
                    address: owner.address
                }
                : {}),
            ...(agency
                ? {
                    profileType: 'Agency',
                    __agencyId: agency.id,
                    agencyName: agency.name,
                    location: agency.location,
                    agencyStatus: agency.status,
                    address: agency.address
                }
                : {})
        };
    };

    const fetchAllData = async ({ silent = false } = {}) => {
        const requestSequence = ++refreshSequence.current;
        if (!silent) {
            setIsLoading(true);
        }

        setError('');

        const results = await Promise.allSettled([
            adminApi.getUsers(),
            adminApi.getCustomers(),
            adminApi.getOwners(),
            adminApi.getAgencies(),
            adminApi.getCars(),
            adminApi.getBookings(),
            adminApi.getBids(),
            adminApi.getNotifications(),
            adminApi.getLogs()
        ]);

        const setters = [
            setUsers,
            setCustomers,
            setOwners,
            setAgencies,
            setCars,
            setBookings,
            setBids,
            setNotifications,
            setSystemLogs
        ];
        const labels = ['users', 'customers', 'owners', 'agencies', 'cars', 'bookings', 'bids', 'notifications', 'logs'];
        const optionalLabels = new Set(['customers', 'owners', 'notifications', 'logs']);
        const failed = [];
        results.forEach((result, index) => {
            if (requestSequence !== refreshSequence.current) {
                return;
            }
            if (result.status === 'fulfilled') {
                setters[index](Array.isArray(result.value) ? result.value : []);
            } else {
                if (!optionalLabels.has(labels[index])) {
                    failed.push(labels[index]);
                }
                console.error(`Failed to fetch ${labels[index]} data:`, result.reason);
            }
        });
        if (requestSequence === refreshSequence.current && failed.length) {
            setError(`Some admin data could not be synchronized: ${failed.join(', ')}.`);
        }
        if (requestSequence === refreshSequence.current && !silent) {
            setIsLoading(false);
        }
    };

    const fetchSummary = async ({ silent = false } = {}) => {
        try {
            const data = await adminApi.getSummary();
            setSummary(data);
        } catch (err) {
            console.error('Failed to fetch summary:', err);

            if (!silent) {
                setError(
                    'Summary metrics are temporarily unavailable. Showing current records.'
                );
            }
        }
    };

    useEffect(() => {
        fetchAllData();
        fetchSummary();

        const refresh = () => {
            if (document.visibilityState === 'visible') {
                fetchAllData({ silent: true });
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
    }, []);

    const handleCreateUser = async (event) => {
        event.preventDefault();
        setIsCreatingUser(true);
        setError('');
        try {
            const created = await adminApi.registerUser({
                ...createUserForm,
                name: createUserForm.name.trim(),
                email: createUserForm.email.trim().toLowerCase(),
                phoneNumber: createUserForm.phoneNumber.trim() || null
            });
            setUsers((current) => [created, ...current]);
            setCreateUserForm({
                name: '',
                email: '',
                phoneNumber: '',
                password: '',
                role: 'CUSTOMER',
                status: 'ACTIVE'
            });
            setIsCreateUserOpen(false);
            await fetchSummary({ silent: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Unable to create the user.'
            );
        } finally {
            setIsCreatingUser(false);
        }
    };

    // ------------------------------------------------------------
    // DELETE
    // ------------------------------------------------------------

    const handleDeleteItem = async (id, tabName) => {
        if (
            !window.confirm(
                `Are you sure you want to delete item #${id} from ${tabName}?`
            )
        ) {
            return;
        }

        try {
            if (tabName === 'CARS') {
                await adminApi.removeCar(id);
                setCars((current) =>
                    current.filter((item) => item.id !== id)
                );
            } else if (tabName === 'USERS') {
                await adminApi.removeUser(id);
                setUsers((current) =>
                    current.filter((item) => item.id !== id)
                );
            } else if (tabName === 'AGENCIES') {
                await adminApi.removeAgency(id);
                setAgencies((current) =>
                    current.filter((item) => item.id !== id)
                );
            } else if (tabName === 'BIDS') {
                await adminApi.removeBid(id);
                setBids((current) =>
                    current.filter((item) => item.id !== id)
                );
            }

            await fetchSummary({ silent: true });
        } catch (err) {
            console.error(`Failed to delete ${tabName}:`, err);
            alert(`Failed to delete item from ${tabName}.`);
        }
    };

    // ------------------------------------------------------------
    // BID STATUS
    // ------------------------------------------------------------

    const handleUpdateBidStatus = async (bidIdValue, newStatus) => {
        try {
            const updatedBid = await adminApi.updateBidStatus(
                bidIdValue,
                newStatus
            );

            setBids((current) =>
                current.map((bid) =>
                    bid.id === bidIdValue
                        ? updatedBid || { ...bid, status: newStatus }
                        : bid
                )
            );

            await fetchSummary({ silent: true });
        } catch (err) {
            console.error('Failed to update bid status:', err);
            alert('Failed to update bid status.');
        }
    };

    // ------------------------------------------------------------
    // USER STATUS
    // ------------------------------------------------------------

    const handleUpdateUserStatus = async (userId, status) => {
        try {
            const updatedUser = await adminApi.updateUserStatus(
                userId,
                status
            );

            setUsers((current) =>
                current.map((user) =>
                    user.id === userId
                        ? updatedUser || { ...user, status }
                        : user
                )
            );

            await fetchSummary({ silent: true });
        } catch (err) {
            console.error('Failed to update user status:', err);
            alert('Failed to update user status.');
        }
    };

    // ------------------------------------------------------------
    // BOOKING STATUS
    // ------------------------------------------------------------

    const handleUpdateBookingStatus = async (
        bookingIdValue,
        status
    ) => {
        try {
            const updatedBooking =
                await adminApi.updateBookingStatus(
                    bookingIdValue,
                    status
                );

            setBookings((current) =>
                current.map((booking) =>
                    booking.id === bookingIdValue
                        ? updatedBooking || {
                            ...booking,
                            status
                        }
                        : booking
                )
            );

            await fetchSummary({ silent: true });
        } catch (err) {
            console.error(
                'Failed to update booking status:',
                err
            );
            alert('Failed to update booking status.');
        }
    };

    // ------------------------------------------------------------
    // CAR SAVE
    // ------------------------------------------------------------

    const handleUpdateCar = async (carData, images) => {
        try {
            let updatedCar;

            if (editingCar) {
                updatedCar = await fleetApi.updateVehicleAsAdmin(
                    editingCar.id,
                    carData,
                    images
                );
            } else {
                updatedCar = await adminApi.createCar(
                    carData,
                    null,
                    images
                );
            }

            if (updatedCar?.id) {
                if (editingCar) {
                    setCars((current) =>
                        current.map((car) =>
                            car.id === updatedCar.id
                                ? updatedCar
                                : car
                        )
                    );
                } else {
                    setCars((current) => [
                        updatedCar,
                        ...current
                    ]);
                }
            } else {
                await fetchAllData({ silent: true });
            }

            setEditingCar(null);
            setIsCarModalOpen(false);
        } catch (err) {
            console.error('Failed to save car:', err);
            alert('Failed to save car.');
        }
    };

    // ------------------------------------------------------------
    // FIND AGENCY
    // ------------------------------------------------------------

    const handleFindAgency = async (event) => {
        event.preventDefault();

        if (!agencyId) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const agency = await adminApi.getAgency(agencyId);

            setAgencies(agency ? [agency] : []);

            if (!agency) {
                setError(
                    'Agency was not found. Check the ID and try again.'
                );
            }
        } catch (err) {
            console.error('Failed to find agency:', err);
            setAgencies([]);
            setError(
                'Agency was not found. Check the ID and try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------
    // FIND BOOKING
    // ------------------------------------------------------------

    const handleFindBooking = async (event) => {
        event.preventDefault();

        if (!bookingId) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const booking = await adminApi.getBooking(bookingId);

            setBookings(booking ? [booking] : []);

            if (!booking) {
                setError(
                    'Booking was not found. Check the ID and try again.'
                );
            }
        } catch (err) {
            console.error('Failed to find booking:', err);
            setBookings([]);
            setError(
                'Booking was not found. Check the ID and try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------
    // CANCEL BOOKING
    // ------------------------------------------------------------

    const handleCancelBooking = async (id) => {
        if (!window.confirm(`Cancel booking #${id}?`)) {
            return;
        }

        try {
            await adminApi.cancelBooking(id);

            setBookings((current) =>
                current.map((booking) =>
                    booking.id === id
                        ? {
                            ...booking,
                            status: 'CANCELLED'
                        }
                        : booking
                )
            );

            await fetchSummary({ silent: true });
        } catch (err) {
            console.error('Failed to cancel booking:', err);
            alert('Failed to cancel booking.');
        }
    };

    // ------------------------------------------------------------
    // USER / AGENCY EDIT
    // ------------------------------------------------------------

    const handleSaveEdit = async (event) => {
        event.preventDefault();

        const { data } = activeModal;

        if (!data?.id) {
            return;
        }

        try {
            if (activeTab === 'USERS') {
                const {
                    password,
                    __customerId,
                    __ownerId,
                    __agencyId,
                    profileType,
                    agencyName,
                    agencyStatus,
                    dob,
                    licenseNo,
                    location,
                    address,
                    ...userData
                } = data;
                const updatedUser = await adminApi.updateUser(
                    data.id,
                    userData
                );

                setUsers((current) =>
                    current.map((user) =>
                        user.id === data.id
                            ? updatedUser || data
                            : user
                    )
                );
                if (__customerId) {
                    const parsedAddress = typeof address === 'string'
                        ? JSON.parse(address)
                        : address;
                    const updatedCustomer = await adminApi.updateCustomer(
                        __customerId,
                        { dob, licenseNo, location, address: parsedAddress }
                    );
                    setCustomers((current) =>
                        current.map((customer) =>
                            customer.id === __customerId
                                ? updatedCustomer
                                : customer
                        )
                    );
                }
                if (__ownerId) {
                    const parsedAddress = typeof address === 'string'
                        ? JSON.parse(address)
                        : address;
                    const updatedOwner = await adminApi.updateOwner(
                        __ownerId,
                        { dob, location, address: parsedAddress }
                    );
                    setOwners((current) =>
                        current.map((owner) =>
                            owner.id === __ownerId ? updatedOwner : owner
                        )
                    );
                }
                if (__agencyId) {
                    const parsedAddress = typeof address === 'string'
                        ? JSON.parse(address)
                        : address;
                    const updatedAgency = await adminApi.updateAgency(
                        __agencyId,
                        {
                            name: data.agencyName || data.name,
                            location,
                            status: data.agencyStatus || data.status,
                            address: parsedAddress
                        }
                    );
                    setAgencies((current) =>
                        current.map((agency) =>
                            agency.id === __agencyId ? updatedAgency : agency
                        )
                    );
                }
                if (password?.trim()) {
                    await adminApi.updateUserPassword(data.id, password.trim());
                }
                await fetchSummary({ silent: true });
            } else if (activeTab === 'AGENCIES') {
                const updatedAgency =
                    await adminApi.updateAgency(
                        data.id,
                        {
                            name: data.name,
                            location: data.location,
                            status: data.status,
                            address: typeof data.address === 'string'
                                ? JSON.parse(data.address)
                                : data.address
                        }
                    );

                setAgencies((current) =>
                    current.map((agency) =>
                        agency.id === data.id
                            ? updatedAgency || data
                            : agency
                    )
                );
                const agencyUser = users.find(
                    (user) => user.email === data.email
                );
                if (agencyUser) {
                    const updatedUser = await adminApi.updateUser(
                            agencyUser.id,
                            {
                                name: data.name,
                                email: data.email,
                                phoneNumber: data.phone,
                                role: agencyUser.role,
                                status: agencyUser.status
                            }
                    );
                    setUsers((current) =>
                            current.map((user) =>
                                user.id === agencyUser.id ? updatedUser : user
                            )
                    );
                }
            } else {
                throw new Error(
                    'This record cannot be edited here.'
                );
            }

            setActiveModal({
                type: null,
                data: null
            });
        } catch (err) {
            console.error('Failed to save edits:', err);
            alert(`Failed to save edits for ${activeTab}.`);
        }
    };

    const handleDeleteProfile = async (profile) => {
        if (!profile?.id || !window.confirm(
            `Delete the ${profile.profileType || 'user'} profile and its user account?`
        )) {
            return;
        }

        try {
            if (profile.__customerId) {
                await adminApi.removeCustomer(profile.__customerId);
                setCustomers((current) => current.filter((item) => item.id !== profile.__customerId));
            }
            if (profile.__ownerId) {
                await adminApi.removeOwner(profile.__ownerId);
                setOwners((current) => current.filter((item) => item.id !== profile.__ownerId));
            }
            if (profile.__agencyId) {
                await adminApi.removeAgency(profile.__agencyId);
                setAgencies((current) => current.filter((item) => item.id !== profile.__agencyId));
            }
            await adminApi.removeUser(profile.id);
            setUsers((current) => current.filter((item) => item.id !== profile.id));
            setActiveModal({ type: null, data: null });
            await fetchSummary({ silent: true });
        } catch (err) {
            console.error('Failed to delete profile:', err);
            setError('The profile could not be deleted. Please try again.');
        }
    };

    // ------------------------------------------------------------
    // STATS
    // ------------------------------------------------------------

    const stats = {
        totalUsers:
            summary?.totalUsers ?? users.length,

        activeFleet:
            summary?.activeFleet ??
            cars.filter((car) => car.isAvailable).length,

        totalBookings:
            summary?.totalBookings ?? bookings.length,

        totalRevenue:
            summary?.totalRevenue ?? null,

        pendingAgencies:
            summary?.pendingAgencies ??
            agencies.filter(
                (agency) => agency.status === 'PENDING'
            ).length,

        pendingBookings:
            summary?.pendingBookings ??
            bookings.filter(
                (booking) => booking.status === 'PENDING'
            ).length,

        pendingBids:
            summary?.pendingBids ??
            bids.filter(
                (bid) => bid.status === 'PENDING'
            ).length
    };

    // ------------------------------------------------------------
    // FILTERED DATA
    // ------------------------------------------------------------

    const filteredUsers = users.filter(
        (user) =>
            userRoleFilter === 'ALL' ||
            user.role === userRoleFilter
    );

    const filteredAgencies = agencies.filter(
        (agency) =>
            agencyFilter === 'ALL' ||
            agency.status === agencyFilter
    );

    const filteredBookings = bookings.filter(
        (booking) =>
            bookingStatusFilter === 'ALL' ||
            booking.status === bookingStatusFilter
    );

    const filteredCars = cars.filter(
        (car) =>
            vehicleCategoryFilter === 'ALL' ||
            (car.type || 'SEDAN') === vehicleCategoryFilter
    );

    const filteredBids = bids.filter(
        (bid) =>
            bidStatusFilter === 'ALL' ||
            bid.status === bidStatusFilter
    );

    // ------------------------------------------------------------
    // STYLES
    // ------------------------------------------------------------

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
        color,
        fontWeight: '500',
        fontSize: '0.75rem',
        cursor: 'pointer'
    });

    // ------------------------------------------------------------
    // RENDER
    // ------------------------------------------------------------

    return (
        <div
            className="admin-dashboard"
            style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '1.5rem',
                fontFamily:
                    'system-ui, -apple-system, sans-serif'
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2
                    style={{
                        margin: 0,
                        color: '#0f172a'
                    }}
                >
                    System Administration
                </h2>

                <p
                    style={{
                        margin: '0.25rem 0 0',
                        color: '#64748b',
                        fontSize: '0.9rem'
                    }}
                >
                    Manage users, agencies, available cars,
                    bookings, marketplace bids, and reports.
                </p>
            </div>

            {/* Metrics */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}
            >
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.85rem',
                            color: '#64748b'
                        }}
                    >
                        Total Users
                    </span>

                    <h3
                        style={{
                            margin: '0.25rem 0 0',
                            color: '#1e293b'
                        }}
                    >
                        {stats.totalUsers}
                    </h3>
                </div>

                <div
                    style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.85rem',
                            color: '#64748b'
                        }}
                    >
                        Active Fleet
                    </span>

                    <h3
                        style={{
                            margin: '0.25rem 0 0',
                            color: '#2563eb'
                        }}
                    >
                        {stats.activeFleet}
                    </h3>
                </div>

                <div
                    style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.85rem',
                            color: '#64748b'
                        }}
                    >
                        Total Bookings
                    </span>

                    <h3
                        style={{
                            margin: '0.25rem 0 0',
                            color: '#16a34a'
                        }}
                    >
                        {stats.totalBookings}
                    </h3>
                </div>

                <div
                    style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.85rem',
                            color: '#64748b'
                        }}
                    >
                        Total Revenue
                    </span>

                    <h3
                        style={{
                            margin: '0.25rem 0 0',
                            color: '#0f766e'
                        }}
                    >
                        {stats.totalRevenue === null
                            ? 'N/A'
                            : `Rs ${Number(
                                stats.totalRevenue
                            ).toLocaleString('en-IN')}`}
                    </h3>
                </div>
            </div>

            {/* Pending items */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.6rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem'
                }}
            >
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsCreateUserOpen(true)}
                >
                    + Add user
                </button>
                {[
                    [
                        'Pending agency approvals',
                        stats.pendingAgencies
                    ],
                    [
                        'Pending bookings',
                        stats.pendingBookings
                    ],
                    [
                        'Pending bids',
                        stats.pendingBids
                    ]
                ].map(([label, value]) => (
                    <div
                        key={label}
                        style={{
                            padding: '0.55rem 0.8rem',
                            borderRadius: '999px',
                            background: '#fff7ed',
                            border: '1px solid #fed7aa',
                            color: '#9a3412',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}
                    >
                        {label}: {value}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={async () => {
                        setSummary(null);

                        try {
                            const data =
                                await adminApi.getSummary();

                            setSummary(data);
                        } catch (err) {
                            console.error(
                                'Failed to refresh metrics:',
                                err
                            );

                            setError(
                                'Summary metrics are temporarily unavailable.'
                            );
                        }
                    }}
                    style={{
                        marginLeft: 'auto',
                        padding: '0.5rem 0.8rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#fff',
                        color: '#334155',
                        cursor: 'pointer'
                    }}
                >
                    Refresh metrics
                </button>
            </div>

            {/* Main layout */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}
            >
                {/* Sidebar */}
                <div
                    style={{
                        ...cardStyle,
                        padding: '1rem'
                    }}
                >
                    <h4
                        style={{
                            margin: '0 0 1rem',
                            color: '#0f172a',
                            fontSize: '0.95rem',
                            paddingBottom: '0.5rem',
                            borderBottom:
                                '1px solid #f1f5f9'
                        }}
                    >
                        Management Sections
                    </h4>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}
                    >
                        {[
                            {
                                id: 'USERS',
                                label: 'User Management',
                                count: users.length
                            },
                            {
                                id: 'BOOKINGS',
                                label: 'Booking Management',
                                count: bookings.length
                            },
                            {
                                id: 'CARS',
                                label: 'Car Inventory',
                                count: cars.length
                            },
                            {
                                id: 'BIDS',
                                label: 'Bids Management',
                                count: bids.length
                            },
                            {
                                id: 'REPORTS',
                                label: 'Reports & Analytics',
                                count: null
                            },
                            {
                                id: 'NOTIFICATIONS',
                                label: 'Notification Center',
                                count: notifications.length
                            },
                            {
                                id: 'LOGS',
                                label: 'System Logs',
                                count: systemLogs.length
                            }
                        ].map((tab) => {
                            const isSelected =
                                activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() =>
                                        setActiveTab(tab.id)
                                    }
                                    style={{
                                        display: 'flex',
                                        justifyContent:
                                            'space-between',
                                        alignItems: 'center',
                                        padding:
                                            '0.75rem 1rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: isSelected
                                            ? '600'
                                            : '500',
                                        fontSize: '0.875rem',
                                        backgroundColor:
                                            isSelected
                                                ? '#eff6ff'
                                                : 'transparent',
                                        color: isSelected
                                            ? '#2563eb'
                                            : '#475569',
                                        textAlign: 'left'
                                    }}
                                >
                                    <span>
                                        {tab.label}
                                    </span>

                                    {tab.count !== null && (
                                        <span
                                            style={{
                                                fontSize:
                                                    '0.75rem',
                                                padding:
                                                    '0.15rem 0.5rem',
                                                borderRadius:
                                                    '12px',
                                                backgroundColor:
                                                    isSelected
                                                        ? '#2563eb'
                                                        : '#f1f5f9',
                                                color: isSelected
                                                    ? '#ffffff'
                                                    : '#64748b',
                                                fontWeight:
                                                    'bold'
                                            }}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active view */}
                <div style={cardStyle}>
                    {error && (
                        <div
                            style={{
                                padding:
                                    '0.75rem 1rem',
                                color: '#b91c1c',
                                backgroundColor: '#fef2f2',
                                borderRadius: '6px',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div
                            style={{
                                padding: '3rem',
                                textAlign: 'center',
                                color: '#64748b'
                            }}
                        >
                            Loading details...
                        </div>
                    ) : (
                        <>
                            {/* USERS */}
                            {activeTab === 'USERS' && (
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize:
                                                    '1.1rem',
                                                color: '#0f172a'
                                            }}
                                        >
                                            User Directory
                                        </h3>

                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            {[
                                                'ALL',
                                                'CUSTOMER',
                                                'AGENCY',
                                                'OWNER',
                                                'ADMIN'
                                            ].map((role) => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() =>
                                                        setUserRoleFilter(
                                                            role
                                                        )
                                                    }
                                                    style={filterTabStyle(
                                                        userRoleFilter ===
                                                        role
                                                    )}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse:
                                                'collapse',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    backgroundColor:
                                                        '#f8fafc',
                                                    borderBottom:
                                                        '2px solid #e2e8f0'
                                                }}
                                            >
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    ID
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Email Address
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Role
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem',
                                                        textAlign:
                                                            'right'
                                                    }}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredUsers.length ===
                                                0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="5"
                                                        style={{
                                                            padding:
                                                                '2rem',
                                                            textAlign:
                                                                'center',
                                                            color: '#94a3b8'
                                                        }}
                                                    >
                                                        No user
                                                        records
                                                        match the
                                                        selected
                                                        filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map(
                                                    (user) => (
                                                        <tr
                                                            key={
                                                                user.id
                                                            }
                                                            style={{
                                                                borderBottom:
                                                                    '1px solid #f1f5f9'
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                #
                                                                {
                                                                    user.id
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                {
                                                                    user.email
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        padding:
                                                                            '0.2rem 0.5rem',
                                                                        borderRadius:
                                                                            '4px',
                                                                        backgroundColor:
                                                                            '#f1f5f9'
                                                                    }}
                                                                >
                                                                    {
                                                                        user.role
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                <select
                                                                    value={
                                                                        user.status ||
                                                                        'ACTIVE'
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        handleUpdateUserStatus(
                                                                            user.id,
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    style={{
                                                                        color:
                                                                            user.status ===
                                                                                'ACTIVE'
                                                                                ? '#16a34a'
                                                                                : '#dc2626',
                                                                        border:
                                                                            'none',
                                                                        background:
                                                                            'transparent',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    {[
                                                                        'ACTIVE',
                                                                        'SUSPENDED',
                                                                        'BLOCKED'
                                                                    ].map(
                                                                        (
                                                                            status
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    status
                                                                                }
                                                                                value={
                                                                                    status
                                                                                }
                                                                            >
                                                                                {
                                                                                    status
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem',
                                                                    textAlign:
                                                                        'right'
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        gap: '0.35rem',
                                                                        justifyContent:
                                                                            'flex-end'
                                                                    }}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setActiveModal(
                                                                                {
                                                                                    type: 'PROFILE',
                                                                                    data: getAdminProfileData(user)
                                                                                }
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#e2e8f0',
                                                                            '#334155'
                                                                        )}
                                                                    >
                                                                        Profile
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setActiveModal(
                                                                                {
                                                                                    type: 'EDIT',
                                                                                    data: {
                                                                                        ...getAdminProfileData(user),
                                                                                        ...(user.role === 'CUSTOMER'
                                                                                            ? (() => {
                                                                                                const customer = customers.find(
                                                                                                    (item) => item.user?.id === user.id
                                                                                                    || item.email === user.email
                                                                                                );
                                                                                                return customer
                                                                                                    ? {
                                                                                                        __customerId: customer.id,
                                                                                                        dob: customer.dob,
                                                                                                        licenseNo: customer.licenseNo,
                                                                                                        location: customer.location,
                                                                                                        address: customer.address
                                                                                                    }
                                                                                                    : {};
                                                                                            })()
                                                                                            : user.role === 'OWNER'
                                                                                                ? (() => {
                                                                                                    const owner = owners.find(
                                                                                                        (item) => item.user?.id === user.id
                                                                                                        || item.email === user.email
                                                                                                    );
                                                                                                    return owner
                                                                                                        ? {
                                                                                                            __ownerId: owner.id,
                                                                                                            dob: owner.dob,
                                                                                                            location: owner.location,
                                                                                                            address: owner.address
                                                                                                        }
                                                                                                        : {};
                                                                                                })()
                                                                                            : {}),
                                                                                        password: ''
                                                                                    }
                                                                                }
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#dbeafe',
                                                                            '#1d4ed8'
                                                                        )}
                                                                    >
                                                                        Edit
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDeleteItem(
                                                                                user.id,
                                                                                'USERS'
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#fee2e2',
                                                                            '#b91c1c'
                                                                        )}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* AGENCIES */}
                            {activeTab === 'AGENCIES' && (
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize:
                                                    '1.1rem',
                                                color: '#0f172a'
                                            }}
                                        >
                                            Agency Directory
                                        </h3>

                                        <select
                                            value={
                                                agencyFilter
                                            }
                                            onChange={(event) =>
                                                setAgencyFilter(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            style={{
                                                padding: '0.4rem',
                                                border:
                                                    '1px solid #cbd5e1',
                                                borderRadius:
                                                    '4px'
                                            }}
                                        >
                                            {[
                                                'ALL',
                                                'PENDING',
                                                'APPROVED',
                                                'REJECTED',
                                                'SUSPENDED',
                                                'BLOCKED'
                                            ].map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <form
                                        onSubmit={
                                            handleFindAgency
                                        }
                                        style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <input
                                            type="number"
                                            min="1"
                                            value={agencyId}
                                            onChange={(event) =>
                                                setAgencyId(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="Agency ID"
                                            style={{
                                                padding: '0.5rem',
                                                border:
                                                    '1px solid #cbd5e1',
                                                borderRadius:
                                                    '4px'
                                            }}
                                        />

                                        <button
                                            type="submit"
                                            style={actionBtnStyle(
                                                '#2563eb',
                                                '#ffffff'
                                            )}
                                        >
                                            Find Agency
                                        </button>
                                    </form>

                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse:
                                                'collapse',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    backgroundColor:
                                                        '#f8fafc',
                                                    borderBottom:
                                                        '2px solid #e2e8f0'
                                                }}
                                            >
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    ID
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Name
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Email
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem',
                                                        textAlign:
                                                            'right'
                                                    }}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredAgencies.length ===
                                                0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="4"
                                                        style={{
                                                            padding:
                                                                '2rem',
                                                            textAlign:
                                                                'center',
                                                            color: '#94a3b8'
                                                        }}
                                                    >
                                                        Enter an
                                                        agency ID
                                                        to load a
                                                        record.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAgencies.map(
                                                    (
                                                        agency
                                                    ) => (
                                                        <tr
                                                            key={
                                                                agency.id
                                                            }
                                                            style={{
                                                                borderBottom:
                                                                    '1px solid #f1f5f9'
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                #
                                                                {
                                                                    agency.id
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                {agency.name ||
                                                                    agency.agencyName ||
                                                                    '-'}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                {agency.email ||
                                                                    '-'}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem',
                                                                    textAlign:
                                                                        'right'
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        gap: '0.35rem',
                                                                        justifyContent:
                                                                            'flex-end'
                                                                    }}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setActiveModal(
                                                                                {
                                                                                    type: 'VIEW',
                                                                                    data: agency
                                                                                }
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#e2e8f0',
                                                                            '#334155'
                                                                        )}
                                                                    >
                                                                        View
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setActiveModal(
                                                                                {
                                                                                    type: 'EDIT',
                                                                                    data: {
                                                                                        ...agency
                                                                                    }
                                                                                }
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#dbeafe',
                                                                            '#1d4ed8'
                                                                        )}
                                                                    >
                                                                        Edit
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDeleteItem(
                                                                                agency.id,
                                                                                'AGENCIES'
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#fee2e2',
                                                                            '#b91c1c'
                                                                        )}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* CARS */}
                            {activeTab === 'CARS' && (
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                alignItems:
                                                    'center'
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    fontSize:
                                                        '1.1rem',
                                                    color: '#0f172a'
                                                }}
                                            >
                                                Car Inventory
                                            </h3>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingCar(
                                                        null
                                                    );
                                                    setIsCarModalOpen(
                                                        true
                                                    );
                                                }}
                                                style={actionBtnStyle(
                                                    '#2563eb',
                                                    '#ffffff'
                                                )}
                                            >
                                                Add Car
                                            </button>
                                        </div>

                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            {[
                                                'ALL',
                                                'SEDAN',
                                                'SUV',
                                                'HATCHBACK',
                                                'LUXURY'
                                            ].map((category) => (
                                                <button
                                                    key={
                                                        category
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        setVehicleCategoryFilter(
                                                            category
                                                        )
                                                    }
                                                    style={filterTabStyle(
                                                        vehicleCategoryFilter ===
                                                        category
                                                    )}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse:
                                                'collapse',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    backgroundColor:
                                                        '#f8fafc',
                                                    borderBottom:
                                                        '2px solid #e2e8f0'
                                                }}
                                            >
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    ID
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Vehicle Model
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Reg No
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Rate/Day
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem',
                                                        textAlign:
                                                            'right'
                                                    }}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredCars.length ===
                                                0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="6"
                                                        style={{
                                                            padding:
                                                                '2rem',
                                                            textAlign:
                                                                'center',
                                                            color: '#94a3b8'
                                                        }}
                                                    >
                                                        No available
                                                        cars match
                                                        the filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredCars.map(
                                                    (car) => (
                                                        <tr
                                                            key={
                                                                car.id
                                                            }
                                                            style={{
                                                                borderBottom:
                                                                    '1px solid #f1f5f9'
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                #
                                                                {
                                                                    car.id
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem',
                                                                    fontWeight:
                                                                        '500'
                                                                }}
                                                            >
                                                                {
                                                                    car.brand
                                                                }{' '}
                                                                {
                                                                    car.model
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                {car.registrationNo ||
                                                                    '-'}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                ₹
                                                                {car.dailyRate ||
                                                                    '-'}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem',
                                                                    color: car.isAvailable
                                                                        ? '#16a34a'
                                                                        : '#b45309',
                                                                    fontWeight:
                                                                        '500'
                                                                }}
                                                            >
                                                                {car.isAvailable
                                                                    ? 'Available'
                                                                    : 'Unavailable'}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem',
                                                                    textAlign:
                                                                        'right'
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        gap: '0.35rem',
                                                                        justifyContent:
                                                                            'flex-end'
                                                                    }}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setActiveModal(
                                                                                {
                                                                                    type: 'VIEW',
                                                                                    data: car
                                                                                }
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#e2e8f0',
                                                                            '#334155'
                                                                        )}
                                                                    >
                                                                        View
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditingCar(
                                                                                {
                                                                                    ...car
                                                                                }
                                                                            );
                                                                            setIsCarModalOpen(
                                                                                true
                                                                            );
                                                                        }}
                                                                        style={actionBtnStyle(
                                                                            '#dbeafe',
                                                                            '#1d4ed8'
                                                                        )}
                                                                    >
                                                                        Edit
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const nextStatus =
                                                                                    !car.isAvailable;

                                                                                await fleetApi.toggleAvailabilityAsAdmin(
                                                                                    car.id,
                                                                                    nextStatus
                                                                                );

                                                                                setCars(
                                                                                    (
                                                                                        current
                                                                                    ) =>
                                                                                        current.map(
                                                                                            (
                                                                                                item
                                                                                            ) =>
                                                                                                item.id ===
                                                                                                    car.id
                                                                                                    ? {
                                                                                                        ...item,
                                                                                                        isAvailable:
                                                                                                            nextStatus
                                                                                                    }
                                                                                                    : item
                                                                                        )
                                                                                );
                                                                            } catch (err) {
                                                                                console.error(
                                                                                    'Failed to update car availability:',
                                                                                    err
                                                                                );

                                                                                alert(
                                                                                    'Failed to update car availability.'
                                                                                );
                                                                            }
                                                                        }}
                                                                        style={actionBtnStyle(
                                                                            car.isAvailable
                                                                                ? '#fef3c7'
                                                                                : '#dcfce7',
                                                                            car.isAvailable
                                                                                ? '#b45309'
                                                                                : '#15803d'
                                                                        )}
                                                                    >
                                                                        {car.isAvailable
                                                                            ? 'Disable'
                                                                            : 'Enable'}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDeleteItem(
                                                                                car.id,
                                                                                'CARS'
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#fee2e2',
                                                                            '#b91c1c'
                                                                        )}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* BOOKINGS */}
                            {activeTab === 'BOOKINGS' && (
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                alignItems:
                                                    'center'
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    fontSize:
                                                        '1.1rem',
                                                    color: '#0f172a'
                                                }}
                                            >
                                                Booking Management
                                            </h3>

                                            <select
                                                value={
                                                    bookingStatusFilter
                                                }
                                                onChange={(event) =>
                                                    setBookingStatusFilter(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                style={{
                                                    padding:
                                                        '0.4rem',
                                                    border:
                                                        '1px solid #cbd5e1',
                                                    borderRadius:
                                                        '4px'
                                                }}
                                            >
                                                {[
                                                    'ALL',
                                                    'PENDING',
                                                    'CONFIRMED',
                                                    'REJECTED',
                                                    'CANCELLED',
                                                    'COMPLETED'
                                                ].map(
                                                    (status) => (
                                                        <option
                                                            key={
                                                                status
                                                            }
                                                            value={
                                                                status
                                                            }
                                                        >
                                                            {
                                                                status
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <form
                                            onSubmit={
                                                handleFindBooking
                                            }
                                            style={{
                                                display: 'flex',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <input
                                                type="number"
                                                min="1"
                                                value={
                                                    bookingId
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setBookingId(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="Booking ID"
                                                style={{
                                                    padding:
                                                        '0.5rem',
                                                    border:
                                                        '1px solid #cbd5e1',
                                                    borderRadius:
                                                        '4px'
                                                }}
                                            />

                                            <button
                                                type="submit"
                                                style={actionBtnStyle(
                                                    '#2563eb',
                                                    '#ffffff'
                                                )}
                                            >
                                                Find Booking
                                            </button>
                                        </form>
                                    </div>

                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse:
                                                'collapse',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    backgroundColor:
                                                        '#f8fafc',
                                                    borderBottom:
                                                        '2px solid #e2e8f0'
                                                }}
                                            >
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Booking ID
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Customer
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Car ID
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Amount
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem',
                                                        textAlign:
                                                            'right'
                                                    }}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredBookings.length ===
                                                0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="6"
                                                        style={{
                                                            padding:
                                                                '2rem',
                                                            textAlign:
                                                                'center',
                                                            color: '#94a3b8'
                                                        }}
                                                    >
                                                        No booking
                                                        records
                                                        found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredBookings.map(
                                                    (
                                                        booking
                                                    ) => (
                                                        <tr
                                                            key={
                                                                booking.id
                                                            }
                                                            style={{
                                                                borderBottom:
                                                                    '1px solid #f1f5f9'
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                #
                                                                {
                                                                    booking.id
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                {
                                                                    booking.customerEmail
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                #
                                                                {
                                                                    booking.carId
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                ₹
                                                                {
                                                                    booking.totalAmount
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                <select
                                                                    value={
                                                                        booking.status ||
                                                                        'PENDING'
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        handleUpdateBookingStatus(
                                                                            booking.id,
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    style={{
                                                                        padding:
                                                                            '0.25rem',
                                                                        border:
                                                                            '1px solid #cbd5e1',
                                                                        borderRadius:
                                                                            '4px',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    {[
                                                                        'PENDING',
                                                                        'CONFIRMED',
                                                                        'REJECTED',
                                                                        'CANCELLED',
                                                                        'COMPLETED'
                                                                    ].map(
                                                                        (
                                                                            status
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    status
                                                                                }
                                                                                value={
                                                                                    status
                                                                                }
                                                                            >
                                                                                {
                                                                                    status
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem',
                                                                    textAlign:
                                                                        'right'
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        gap: '0.35rem',
                                                                        justifyContent:
                                                                            'flex-end'
                                                                    }}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setActiveModal(
                                                                                {
                                                                                    type: 'VIEW',
                                                                                    data: booking
                                                                                }
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#e2e8f0',
                                                                            '#334155'
                                                                        )}
                                                                    >
                                                                        View
                                                                    </button>

                                                                    {booking.status !==
                                                                        'CANCELLED' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleCancelBooking(
                                                                                        booking.id
                                                                                    )
                                                                                }
                                                                                style={actionBtnStyle(
                                                                                    '#fee2e2',
                                                                                    '#b91c1c'
                                                                                )}
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* BIDS */}
                            {activeTab === 'BIDS' && (
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize:
                                                    '1.1rem',
                                                color: '#0f172a'
                                            }}
                                        >
                                            Marketplace Bids
                                        </h3>

                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            {[
                                                'ALL',
                                                'PENDING',
                                                'ACCEPTED',
                                                'REJECTED'
                                            ].map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() =>
                                                        setBidStatusFilter(
                                                            status
                                                        )
                                                    }
                                                    style={filterTabStyle(
                                                        bidStatusFilter ===
                                                        status
                                                    )}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse:
                                                'collapse',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    backgroundColor:
                                                        '#f8fafc',
                                                    borderBottom:
                                                        '2px solid #e2e8f0'
                                                }}
                                            >
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Bid ID
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Bidder
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Offer Price
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem'
                                                    }}
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    style={{
                                                        padding:
                                                            '0.75rem',
                                                        textAlign:
                                                            'right'
                                                    }}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredBids.length ===
                                                0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="5"
                                                        style={{
                                                            padding:
                                                                '2rem',
                                                            textAlign:
                                                                'center',
                                                            color: '#94a3b8'
                                                        }}
                                                    >
                                                        No bids
                                                        found for
                                                        this
                                                        status.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredBids.map(
                                                    (bid) => (
                                                        <tr
                                                            key={
                                                                bid.id
                                                            }
                                                            style={{
                                                                borderBottom:
                                                                    '1px solid #f1f5f9'
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                #
                                                                {
                                                                    bid.id
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                {bid.bidderEmail ||
                                                                    `User #${bid.userId}`}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                ₹
                                                                {
                                                                    bid.amount
                                                                }
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem'
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        padding:
                                                                            '0.2rem 0.5rem',
                                                                        borderRadius:
                                                                            '4px',
                                                                        fontSize:
                                                                            '0.75rem',
                                                                        fontWeight:
                                                                            'bold',
                                                                        backgroundColor:
                                                                            bid.status ===
                                                                                'ACCEPTED'
                                                                                ? '#dcfce7'
                                                                                : bid.status ===
                                                                                    'REJECTED'
                                                                                    ? '#fee2e2'
                                                                                    : '#fef3c7',
                                                                        color:
                                                                            bid.status ===
                                                                                'ACCEPTED'
                                                                                ? '#15803d'
                                                                                : bid.status ===
                                                                                    'REJECTED'
                                                                                    ? '#b91c1c'
                                                                                    : '#b45309'
                                                                    }}
                                                                >
                                                                    {
                                                                        bid.status
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '0.75rem',
                                                                    textAlign:
                                                                        'right'
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        gap: '0.35rem',
                                                                        justifyContent:
                                                                            'flex-end'
                                                                    }}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setActiveModal(
                                                                                {
                                                                                    type: 'VIEW',
                                                                                    data: bid
                                                                                }
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#e2e8f0',
                                                                            '#334155'
                                                                        )}
                                                                    >
                                                                        View
                                                                    </button>

                                                                    {bid.status ===
                                                                        'PENDING' && (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleUpdateBidStatus(
                                                                                            bid.id,
                                                                                            'ACCEPTED'
                                                                                        )
                                                                                    }
                                                                                    style={actionBtnStyle(
                                                                                        '#16a34a',
                                                                                        '#fff'
                                                                                    )}
                                                                                >
                                                                                    Accept
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleUpdateBidStatus(
                                                                                            bid.id,
                                                                                            'REJECTED'
                                                                                        )
                                                                                    }
                                                                                    style={actionBtnStyle(
                                                                                        '#dc2626',
                                                                                        '#fff'
                                                                                    )}
                                                                                >
                                                                                    Reject
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDeleteItem(
                                                                                bid.id,
                                                                                'BIDS'
                                                                            )
                                                                        }
                                                                        style={actionBtnStyle(
                                                                            '#fee2e2',
                                                                            '#b91c1c'
                                                                        )}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* REPORTS */}
                            {activeTab === 'REPORTS' && (
                                <ReportsManager />
                            )}

                            {['NOTIFICATIONS', 'LOGS'].includes(activeTab) && (
                                <section className="admin-monitoring-panel">
                                    <div className="admin-monitoring-panel__header">
                                        <div>
                                            <p className="auth-card__eyebrow">
                                                Operations
                                            </p>
                                            <h3>
                                                {activeTab === 'NOTIFICATIONS'
                                                    ? 'Notification Center'
                                                    : 'System Logs'}
                                            </h3>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => {
                                                fetchAllData({ silent: true });
                                                fetchSummary({ silent: true });
                                            }}
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                    <div className="admin-monitoring-list">
                                        {(activeTab === 'NOTIFICATIONS'
                                            ? notifications
                                            : systemLogs
                                        ).map((event) => (
                                            <article
                                                className="admin-monitoring-item"
                                                key={event.id}
                                            >
                                                <div>
                                                    <strong>{event.type}</strong>
                                                    <p>{event.message}</p>
                                                </div>
                                                <time dateTime={event.createdAt}>
                                                    {new Date(event.createdAt).toLocaleString()}
                                                </time>
                                            </article>
                                        ))}
                                        {(activeTab === 'NOTIFICATIONS'
                                            ? notifications
                                            : systemLogs
                                        ).length === 0 && (
                                            <p className="admin-monitoring-empty">
                                                No events recorded yet.
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* VIEW / EDIT MODAL */}
            {activeModal.type &&
                activeModal.data && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor:
                                'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                width: '100%',
                                maxWidth: '520px',
                                maxHeight: '85vh',
                                overflowY: 'auto',
                                padding: '1.5rem',
                                boxShadow:
                                    '0 10px 25px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent:
                                        'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem',
                                    borderBottom:
                                        '1px solid #e2e8f0',
                                    paddingBottom: '0.5rem'
                                }}
                            >
                                <h4
                                    style={{
                                        margin: 0,
                                        color: '#0f172a'
                                    }}
                                >
                                    {activeModal.type === 'PROFILE' ||
                                    activeModal.type === 'VIEW'
                                        ? 'User Profile'
                                        : 'Edit Information'}
                                </h4>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal({
                                            type: null,
                                            data: null
                                        })
                                    }
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.25rem',
                                        cursor: 'pointer',
                                        color: '#64748b'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>

                            {activeModal.type === 'PROFILE' || activeModal.type === 'VIEW' ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection:
                                            'column',
                                        gap: '0.75rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {getViewEntries(
                                        activeModal.data,
                                        'USERS'
                                    ).map((key) => (
                                        <div
                                            key={key}
                                            style={{
                                                display: 'flex',
                                                justifyContent:
                                                    'space-between',
                                                borderBottom:
                                                    '1px dashed #f1f5f9',
                                                paddingBottom:
                                                    '0.25rem'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: '#64748b',
                                                    fontWeight:
                                                        '500'
                                                }}
                                            >
                                                {formatDetailLabel(
                                                    key
                                                )}
                                                :
                                            </span>

                                            <span
                                                style={{
                                                    color: '#0f172a',
                                                    fontWeight:
                                                        '600',
                                                    textAlign:
                                                        'right',
                                                    maxWidth:
                                                        '60%',
                                                    overflowWrap:
                                                        'anywhere'
                                                }}
                                            >
                                                {formatDetailValue(
                                                    activeModal.data[key]
                                                )}
                                            </span>
                                        </div>
                                    ))}

                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginTop: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveModal({
                                                        type: 'EDIT',
                                                        data: {
                                                            ...activeModal.data,
                                                            password: ''
                                                        }
                                                    })
                                                }
                                                style={actionBtnStyle('#dbeafe', '#1d4ed8')}
                                            >
                                                Edit Profile
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteProfile(activeModal.data)}
                                                style={actionBtnStyle('#fee2e2', '#b91c1c')}
                                            >
                                                Delete Profile
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveModal({
                                                    type: null,
                                                    data: null
                                                })
                                            }
                                            style={actionBtnStyle(
                                                '#cbd5e1',
                                                '#0f172a'
                                            )}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSaveEdit}
                                    style={{
                                        display: 'flex',
                                        flexDirection:
                                            'column',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <h5 style={{ margin: '0.25rem 0', color: '#1d4ed8' }}>
                                        Account details
                                    </h5>
                                    {[
                                        ['name', 'Full name'],
                                        ['email', 'Email address'],
                                        ['phoneNumber', 'Phone number']
                                    ].map(([key, label]) => (
                                        <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>{label}</span>
                                            <input
                                                type={key === 'email' ? 'email' : 'text'}
                                                value={activeModal.data[key] || ''}
                                                onChange={(event) => setActiveModal((current) => ({
                                                    ...current,
                                                    data: { ...current.data, [key]: event.target.value }
                                                }))}
                                                required={key !== 'phone'}
                                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            />
                                        </label>
                                    ))}
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Account status</span>
                                        <select
                                            value={activeModal.data.status || 'ACTIVE'}
                                            onChange={(event) => setActiveModal((current) => ({
                                                ...current,
                                                data: { ...current.data, status: event.target.value }
                                            }))}
                                            style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        >
                                            {['ACTIVE', 'BLOCKED', 'SUSPENDED'].map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <h5 style={{ margin: '0.5rem 0 0.25rem', color: '#1d4ed8' }}>
                                        {activeModal.data.profileType || 'Linked'} profile details
                                    </h5>
                                    {['Customer', 'Owner'].includes(activeModal.data.profileType) && (
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Date of birth</span>
                                            <input
                                                type="date"
                                                value={activeModal.data.dob || ''}
                                                onChange={(event) => setActiveModal((current) => ({
                                                    ...current,
                                                    data: { ...current.data, dob: event.target.value }
                                                }))}
                                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            />
                                        </label>
                                    )}
                                    {activeModal.data.profileType === 'Customer' && (
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Driving license number</span>
                                            <input
                                                value={activeModal.data.licenseNo || ''}
                                                onChange={(event) => setActiveModal((current) => ({
                                                    ...current,
                                                    data: { ...current.data, licenseNo: event.target.value }
                                                }))}
                                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            />
                                        </label>
                                    )}
                                    {activeModal.data.profileType === 'Agency' && (
                                        <>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Agency name</span>
                                                <input
                                                    value={activeModal.data.agencyName || ''}
                                                    onChange={(event) => setActiveModal((current) => ({
                                                        ...current,
                                                        data: { ...current.data, agencyName: event.target.value }
                                                    }))}
                                                    style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </label>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Agency status</span>
                                                <select
                                                    value={activeModal.data.agencyStatus || 'PENDING'}
                                                    onChange={(event) => setActiveModal((current) => ({
                                                        ...current,
                                                        data: { ...current.data, agencyStatus: event.target.value }
                                                    }))}
                                                    style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                >
                                                    {['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((status) => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </>
                                    )}
                                    {activeModal.data.profileType && (
                                        <>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Location</span>
                                                <input
                                                    value={activeModal.data.location || ''}
                                                    onChange={(event) => setActiveModal((current) => ({
                                                        ...current,
                                                        data: { ...current.data, location: event.target.value }
                                                    }))}
                                                    style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                {['doorNo', 'street', 'area', 'city', 'state', 'pincode', 'landmark'].map((key) => (
                                                    <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#475569' }}>{formatDetailLabel(key)}</span>
                                                        <input
                                                            value={activeModal.data.address?.[key] || ''}
                                                            onChange={(event) => setActiveModal((current) => ({
                                                                ...current,
                                                                data: {
                                                                    ...current.data,
                                                                    address: { ...(current.data.address || {}), [key]: event.target.value }
                                                                }
                                                            }))}
                                                            style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>New password (optional)</span>
                                        <input
                                            type="password"
                                            value={activeModal.data.password || ''}
                                            onChange={(event) => setActiveModal((current) => ({
                                                ...current,
                                                data: { ...current.data, password: event.target.value }
                                            }))}
                                            minLength={8}
                                            maxLength={72}
                                            autoComplete="new-password"
                                            style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        />
                                    </label>

                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent:
                                                'flex-end',
                                            gap: '0.5rem',
                                            marginTop: '1rem'
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveModal({
                                                    type: null,
                                                    data: null
                                                })
                                            }
                                            style={actionBtnStyle(
                                                '#e2e8f0',
                                                '#475569'
                                            )}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            style={actionBtnStyle(
                                                '#2563eb',
                                                '#ffffff'
                                            )}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

            {isCreateUserOpen && (
                <div className="modal-backdrop" role="presentation">
                    <form className="modal-content admin-create-user-form" onSubmit={handleCreateUser}>
                        <div className="modal-header">
                            <h3>Create user account</h3>
                            <button
                                type="button"
                                className="close-btn"
                                onClick={() => setIsCreateUserOpen(false)}
                                aria-label="Close create user dialog"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="admin-form-grid">
                            <label className="form-group">
                                <span className="form-label">Full name</span>
                                <input className="form-input" required value={createUserForm.name}
                                    onChange={(event) => setCreateUserForm({ ...createUserForm, name: event.target.value })} />
                            </label>
                            <label className="form-group">
                                <span className="form-label">Email</span>
                                <input className="form-input" type="email" required value={createUserForm.email}
                                    onChange={(event) => setCreateUserForm({ ...createUserForm, email: event.target.value })} />
                            </label>
                            <label className="form-group">
                                <span className="form-label">Mobile number</span>
                                <input className="form-input" value={createUserForm.phoneNumber}
                                    onChange={(event) => setCreateUserForm({ ...createUserForm, phoneNumber: event.target.value })} />
                            </label>
                            <label className="form-group">
                                <span className="form-label">Temporary password</span>
                                <input className="form-input" type="password" minLength={8} maxLength={72} required value={createUserForm.password}
                                    onChange={(event) => setCreateUserForm({ ...createUserForm, password: event.target.value })} />
                            </label>
                            <label className="form-group">
                                <span className="form-label">Role</span>
                                <select className="form-select" value={createUserForm.role}
                                    onChange={(event) => setCreateUserForm({ ...createUserForm, role: event.target.value })}>
                                    {['CUSTOMER', 'AGENCY', 'OWNER', 'ADMIN'].map((role) => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </label>
                            <label className="form-group">
                                <span className="form-label">Status</span>
                                <select className="form-select" value={createUserForm.status}
                                    onChange={(event) => setCreateUserForm({ ...createUserForm, status: event.target.value })}>
                                    {['ACTIVE', 'SUSPENDED', 'BLOCKED'].map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setIsCreateUserOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isCreatingUser}>
                                {isCreatingUser ? 'Creating...' : 'Create user'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* VEHICLE MODAL */}
            <VehicleModal
                isOpen={
                    Boolean(editingCar) ||
                    isCarModalOpen
                }
                initialData={editingCar}
                onClose={() => {
                    setEditingCar(null);
                    setIsCarModalOpen(false);
                }}
                onSubmit={handleUpdateCar}
            />
        </div>
    );
};

export default AdminView;