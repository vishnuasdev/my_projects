import React, { useEffect, useState } from 'react';

const VehicleModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const initialFormState = {
        brand: '',
        model: '',
        registrationNo: '',
        fuelType: 'Diesel',
        transmission: 'Manual',
        dailyRate: '',
        description: '',
        isAvailable: true,
    };

    const [carData, setCarData] = useState({ ...initialFormState, ...initialData });
    const [selectedImages, setSelectedImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setCarData({ ...initialFormState, ...initialData });
    }, [initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCarData({
            ...carData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleFileChange = (e) => {
        setSelectedImages(Array.from(e.target.files));
    };

    const resetForm = () => {
        setCarData({ ...initialFormState, ...initialData });
        setSelectedImages([]);
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const payload = {
            ...(initialData?.id ? { id: initialData.id } : {}),
            brand: carData.brand.trim(),
            model: carData.model.trim(),
            registrationNo: carData.registrationNo.trim().toUpperCase(),
            fuelType: carData.fuelType,
            transmission: carData.transmission,
            dailyRate: Number(carData.dailyRate),
            description: carData.description.trim(),
            isAvailable: Boolean(carData.isAvailable),
        };

        if (!Number.isFinite(payload.dailyRate) || payload.dailyRate < 0.01) {
            setError('Daily rate must be at least ₹0.01.');
            setIsLoading(false);
            return;
        }

        try {
            await onSubmit(payload, selectedImages);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save vehicle details.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '540px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #f1f5f9'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>{initialData ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                    <button 
                        onClick={handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            color: '#64748b',
                            cursor: 'pointer',
                            lineHeight: 1
                        }}
                    >
                        &times;
                    </button>
                </div>

                {error && (
                    <div style={{
                        margin: '1rem 1.5rem 0',
                        padding: '0.75rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#b91c1c',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.35rem' }}>
                                Brand *
                            </label>
                            <input
                                type="text"
                                name="brand"
                                placeholder="e.g. Toyota"
                                value={carData.brand}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.35rem' }}>
                                Model *
                            </label>
                            <input
                                type="text"
                                name="model"
                                placeholder="e.g. Innova Crysta"
                                value={carData.model}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.35rem' }}>
                                Registration No *
                            </label>
                            <input
                                type="text"
                                name="registrationNo"
                                placeholder="TN 01 AB 1234"
                                value={carData.registrationNo}
                                onChange={handleChange}
                                required
                                maxLength="50"
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.35rem' }}>
                                Daily Rate (₹) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="dailyRate"
                                placeholder="1500"
                                value={carData.dailyRate}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.35rem' }}>
                                Transmission
                            </label>
                            <select
                                name="transmission"
                                value={carData.transmission}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.9rem',
                                    backgroundColor: '#fff',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="Manual">Manual</option>
                                <option value="Automatic">Automatic</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.35rem' }}>
                                Fuel Type
                            </label>
                            <select
                                name="fuelType"
                                value={carData.fuelType}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.9rem',
                                    backgroundColor: '#fff',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="Diesel">Diesel</option>
                                <option value="Petrol">Petrol</option>
                                <option value="Electric">Electric</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.35rem' }}>
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows="3"
                            placeholder="Enter details regarding condition, seating capacity, features..."
                            value={carData.description}
                            onChange={handleChange}
                                maxLength="2000"
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.875rem',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '1.25rem 0' }}>
                        <input
                            type="checkbox"
                            id="isAvailable"
                            name="isAvailable"
                            checked={carData.isAvailable}
                            onChange={handleChange}
                            style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                        />
                        <label htmlFor="isAvailable" style={{ fontSize: '0.875rem', color: '#334155', cursor: 'pointer' }}>
                            Available for immediate rental
                        </label>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.35rem' }}>
                            Vehicle Images
                        </label>
                        <div style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            backgroundColor: '#fff'
                        }}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ fontSize: '0.85rem', width: '100%' }}
                            />
                        </div>
                        {selectedImages.length > 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#2563eb', marginTop: '0.35rem', display: 'block' }}>
                                {selectedImages.length} file(s) selected
                            </span>
                        )}
                        {initialData?.imageCount > 0 && selectedImages.length === 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                                {initialData.imageCount} existing image(s) will be kept.
                            </span>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#475569',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Saving...' : 'Save Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleModal;