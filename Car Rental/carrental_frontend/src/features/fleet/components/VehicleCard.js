import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { API_BASE_URL } from '../../../config/constants';

const VehicleCard = ({ car, onSelectBook, isOwner = false }) => {
    const { user } = useAuth();
    const [selectedImage, setSelectedImage] = useState(0);
    const [failedImages, setFailedImages] = useState([]);
    const navigate = useNavigate();
    const embeddedImages = Array.isArray(car.carImage) ? car.carImage : [];
    const imageCount = Math.min(
        5,
        Math.max(embeddedImages.length, Number(car.imageCount || car.images?.length || 0))
    );
    const imageSources = Array.from({ length: imageCount }, (_, index) => embeddedImages[index]
        ? `data:${car.carImageType?.[index] || 'image/jpeg'};base64,${embeddedImages[index]}`
        : `${API_BASE_URL.replace(/\/$/, '')}/api/cars/${car.id}/image/${index}`);

    useEffect(() => {
        setSelectedImage(0);
        setFailedImages([]);
    }, [car.id, car.imageCount, embeddedImages.length]);

    const availableImages = imageSources.filter((_, index) => !failedImages.includes(index));
    const activeImageIndex = availableImages.includes(imageSources[selectedImage])
        ? selectedImage
        : (availableImages.length > 0 ? imageSources.indexOf(availableImages[0]) : -1);

    const handleBookClick = () => {
        if (typeof onSelectBook !== 'function') return;
        if (!user) {
            // Redirect unauthenticated guests to login page
            navigate('/login');
        } else {
            // Proceed with booking modal for logged-in users
            onSelectBook(car);
        }
    };

    return (
        <div className="car-card" style={{ overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <div className="vehicle-image-container" style={{ height: '210px', overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
                {car.id && activeImageIndex >= 0 ? (
                    <img
                        src={imageSources[activeImageIndex]}
                        alt={`${car.brand} ${car.model} view ${activeImageIndex + 1}`}
                        className="vehicle-image"
                        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => {
                            setFailedImages(current => current.includes(activeImageIndex)
                                ? current
                                : [...current, activeImageIndex]);
                        }}
                    />
                ) : (
                    <div className="vehicle-image-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>
                        No Image Available
                    </div>
                )}
            </div>
            {availableImages.length > 1 && (
                <div style={{ display: 'flex', gap: '0.35rem', padding: '0.5rem 0.75rem 0', overflowX: 'auto' }}>
                    {imageSources.map((source, index) => !failedImages.includes(index) && (
                        <button
                            key={source}
                            type="button"
                            onClick={() => setSelectedImage(index)}
                            aria-label={`View image ${index + 1}`}
                            style={{
                                flex: '0 0 42px',
                                height: '34px',
                                padding: 0,
                                border: selectedImage === index ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                background: '#f8fafc',
                                cursor: 'pointer'
                            }}
                        >
                            <img src={source} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setFailedImages(current => current.includes(index) ? current : [...current, index])} />
                        </button>
                    ))}
                </div>
            )}

            <div className="car-details" style={{ padding: '0.75rem' }}>
                <h3 className="car-title" style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>{car.brand} {car.model}</h3>
                <p className="car-meta" style={{ margin: '0.2rem 0', color: '#64748b', fontSize: '0.8rem' }}>{car.type || 'SEDAN'} • {car.fuelType} • {car.transmission}</p>

                <div className="car-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: isOwner ? 'flex-start' : 'space-between', gap: '0.5rem', marginTop: '0.45rem' }}>
                    <div className="car-price">
                        <span className="price-amount" style={{ fontWeight: 700, color: '#0f172a' }}>₹{Number(car.dailyRate || 0).toLocaleString('en-IN')}</span>
                        <span className="price-period" style={{ color: '#64748b', fontSize: '0.75rem' }}> / day</span>
                    </div>

                    {!isOwner && (
                        <button
                            onClick={handleBookClick}
                            className="btn btn-primary btn-sm"
                            disabled={!car.isAvailable}
                        >
                            {car.isAvailable ? 'Book Now' : 'Unavailable'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;