import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import VehicleCard from '../fleet/components/VehicleCard';
import BookingModal from '../bookings/components/BookingModal';
import { bookingApi } from '../bookings/api/bookingApi';
import { API_BASE_URL } from '../../config/constants';
import { tokenStorage } from '../../services/tokenStorage';

const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

const PublicView = ({ isCustomerView = false }) => {
    const navigate = useNavigate();

    const [cars, setCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [fuelFilter, setFuelFilter] = useState('ALL');
    const [transmissionFilter, setTransmissionFilter] = useState('ALL');
    const [maxPrice, setMaxPrice] = useState(null);
    const [sortBy, setSortBy] = useState('DEFAULT');

    // UI View State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const carsPerPage = 6;

    // Booking Modal State
    const [selectedCar, setSelectedCar] = useState(null);

    const fetchCars = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axiosInstance.get('/cars/available');
            const carList = Array.isArray(response.data) ? response.data : [];
            setCars(carList);
            setFilteredCars(carList);

            // Auto-open modal if returning post-login
            const pendingCarId = sessionStorage.getItem('pendingBookingCarId');
            if (pendingCarId) {
                const pendingCar = carList.find((c) => String(c.id) === String(pendingCarId));
                if (pendingCar) {
                    setSelectedCar(pendingCar);
                }
                sessionStorage.removeItem('pendingBookingCarId');
            }
        } catch (err) {
            setError('Failed to load available vehicles. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    const applyFilters = useCallback(() => {
        let result = [...cars];

        // Search by Brand or Model
        const term = normalizeValue(searchTerm);
        if (term !== '') {
            result = result.filter(
                (car) =>
                    [car.brand, car.model, car.registrationNo, car.type]
                        .some((value) => normalizeValue(value).includes(term))
            );
        }

        // Filter by Fuel Type
        if (fuelFilter !== 'ALL') {
            result = result.filter(
                (car) => normalizeValue(car.fuelType) === normalizeValue(fuelFilter)
            );
        }

        // Filter by Transmission
        if (transmissionFilter !== 'ALL') {
            result = result.filter(
                (car) => normalizeValue(car.transmission) === normalizeValue(transmissionFilter)
            );
        }

        // Apply a price limit only after the user changes the slider.
        if (maxPrice !== null) {
            result = result.filter((car) => Number(car.dailyRate) <= maxPrice);
        }

        // Sort Logic
        if (sortBy === 'PRICE_LOW_HIGH') {
            result.sort((a, b) => Number(a.dailyRate || 0) - Number(b.dailyRate || 0));
        } else if (sortBy === 'PRICE_HIGH_LOW') {
            result.sort((a, b) => Number(b.dailyRate || 0) - Number(a.dailyRate || 0));
        } else if (sortBy === 'NAME_ASC') {
            result.sort((a, b) => normalizeValue(a.brand).localeCompare(normalizeValue(b.brand)));
        }

        setFilteredCars(result);
        setCurrentPage(1);
    }, [searchTerm, fuelFilter, transmissionFilter, maxPrice, sortBy, cars]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const resetFilters = () => {
        setSearchTerm('');
        setFuelFilter('ALL');
        setTransmissionFilter('ALL');
        setMaxPrice(null);
        setSortBy('DEFAULT');
    };

    const handleBookClick = (car) => {
        const token = tokenStorage.getToken();
        if (!token) {
            sessionStorage.setItem('pendingBookingCarId', car.id);
            navigate('/login');
            return;
        }
        setSelectedCar(car);
    };

    const handleBookingSubmit = async (bookingData) => {
        if (!bookingData.carId) {
            throw new Error('The selected vehicle is no longer available. Please refresh and try again.');
        }
        await bookingApi.createBooking(bookingData);
        await fetchCars();
    };

    const getCarImageUrl = (car) => {
        if (car.carImage?.length > 0) {
            return `data:${car.carImageType?.[0] || 'image/jpeg'};base64,${car.carImage[0]}`;
        }
        return `${API_BASE_URL.replace(/\/$/, '')}/api/cars/${car.id}/image/0`;
    };

    // Pagination calculations
    const indexOfLastCar = currentPage * carsPerPage;
    const indexOfFirstCar = indexOfLastCar - carsPerPage;
    const currentCars = filteredCars.slice(indexOfFirstCar, indexOfLastCar);
    const totalPages = Math.ceil(filteredCars.length / carsPerPage);

    // Active filters summary badges
    const maxAvailablePrice = Math.max(
        10000,
        ...cars.map((car) => Number(car.dailyRate) || 0)
    );
    const displayedMaxPrice = maxPrice ?? maxAvailablePrice;
    const hasActiveFilters = searchTerm || fuelFilter !== 'ALL' || transmissionFilter !== 'ALL' || maxPrice !== null;

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: isCustomerView ? 'auto' : '100vh', paddingBottom: isCustomerView ? '1.5rem' : '3rem' }}>
            <style>{`
                .vehicle-browser-layout {
                    grid-template-columns: 260px minmax(0, 1fr) !important;
                    align-items: start;
                }

                .vehicle-filter-panel {
                    position: sticky;
                    top: 1rem;
                }

                @media (max-width: 760px) {
                    .vehicle-browser-layout {
                        grid-template-columns: minmax(0, 1fr) !important;
                        gap: 1rem !important;
                    }

                    .vehicle-filter-panel {
                        position: static;
                    }
                }
            `}</style>
            {/* Main Content Layout */}
            <div className="vehicle-browser-layout" style={{ maxWidth: '1200px', margin: '1.5rem auto 0 auto', padding: '0 1rem', display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '1.5rem' }}>
                
                {/* --- Filter & Control Panel --- */}
                <aside className="vehicle-filter-panel" style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>Filter & Sort</h3>
                        <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>
                            Reset All
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Search Vehicle</label>
                        <input
                            type="text"
                            placeholder="Search make, model, type, or registration..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Sort Options */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
                        >
                            <option value="DEFAULT">Recommended</option>
                            <option value="PRICE_LOW_HIGH">Price: Low to High</option>
                            <option value="PRICE_HIGH_LOW">Price: High to Low</option>
                            <option value="NAME_ASC">Brand: A to Z</option>
                        </select>
                    </div>

                    {/* Fuel Type Filter */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Fuel Type</label>
                        <select
                            value={fuelFilter}
                            onChange={(e) => setFuelFilter(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
                        >
                            <option value="ALL">All Fuel Types</option>
                            <option value="DIESEL">Diesel</option>
                            <option value="PETROL">Petrol</option>
                            <option value="ELECTRIC">Electric</option>
                            <option value="HYBRID">Hybrid</option>
                        </select>
                    </div>

                    {/* Transmission Filter */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Transmission</label>
                        <select
                            value={transmissionFilter}
                            onChange={(e) => setTransmissionFilter(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
                        >
                            <option value="ALL">All Transmissions</option>
                            <option value="MANUAL">Manual</option>
                            <option value="AUTOMATIC">Automatic</option>
                        </select>
                    </div>

                    {/* Price Range Filter */}
                    <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Max Price / Day</label>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2563eb' }}>₹{displayedMaxPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max={maxAvailablePrice}
                            step="500"
                            value={displayedMaxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                        />
                    </div>
                </aside>

                {/* --- Vehicles Display Section --- */}
                <main style={{ minWidth: 0 }}>
                    {/* Header Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', backgroundColor: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>
                            Available Vehicles <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>({filteredCars.length})</span>
                        </h2>

                        {/* View Switcher Controls */}
                        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    border: 'none',
                                    backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                                    color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    border: 'none',
                                    backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                                    color: viewMode === 'list' ? '#0f172a' : '#64748b',
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                List
                            </button>
                        </div>
                    </div>

                    {/* Active Filter Tags */}
                    {hasActiveFilters && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Active Filters:</span>
                            {fuelFilter !== 'ALL' && (
                                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '500' }}>
                                    Fuel: {fuelFilter}
                                </span>
                            )}
                            {transmissionFilter !== 'ALL' && (
                                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '500' }}>
                                    Transmission: {transmissionFilter}
                                </span>
                            )}
                            {maxPrice !== null && (
                                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '500' }}>
                                    Max ₹{maxPrice.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Status States & Grid Display */}
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            Loading available fleet...
                        </div>
                    ) : error ? (
                        <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '12px', textAlign: 'center', border: '1px solid #fecaca' }}>
                            <p style={{ margin: 0 }}>{error}</p>
                            <button onClick={fetchCars} style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', backgroundColor: '#b91c1c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                                Retry
                            </button>
                        </div>
                    ) : filteredCars.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <p style={{ color: '#64748b', margin: '0 0 1rem 0' }}>
                                {cars.length === 0
                                    ? 'No vehicles are currently available for booking.'
                                    : 'No vehicles match your selected criteria.'}
                            </p>
                            {cars.length > 0 && (
                                <button onClick={resetFilters} style={{ padding: '0.5rem 1rem', border: '1px solid #2563eb', color: '#2563eb', background: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                                    {currentCars.map((car) => (
                                        <VehicleCard
                                            key={car.id}
                                            car={car}
                                            onSelectBook={handleBookClick}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    {currentCars.map((car, idx) => (
                                        <div 
                                            key={car.id}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'space-between', 
                                                padding: '1rem 1.25rem', 
                                                borderBottom: idx === currentCars.length - 1 ? 'none' : '1px solid #f1f5f9' 
                                            }}
                                        >
                                            <div style={{ width: '96px', height: '64px', flexShrink: 0, marginRight: '1rem', overflow: 'hidden', borderRadius: '6px', backgroundColor: '#f1f5f9' }}>
                                                <img
                                                    src={getCarImageUrl(car)}
                                                    alt={`${car.brand} ${car.model}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                                />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{car.brand} {car.model}</h4>
                                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                                    {car.fuelType} • {car.transmission}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>₹{car.dailyRate}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>/ day</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleBookClick(car)}
                                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                                >
                                                    Book
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ padding: '0 0.75rem', fontSize: '0.875rem', color: '#475569', fontWeight: '500' }}>
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Booking Modal */}
            {selectedCar && (
                <BookingModal
                    isOpen={true}
                    vehicle={selectedCar}
                    onClose={() => setSelectedCar(null)}
                    onSubmit={handleBookingSubmit}
                />
            )}
        </div>
    );
};

export default PublicView;