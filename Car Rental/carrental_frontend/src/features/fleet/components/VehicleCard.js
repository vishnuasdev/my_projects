import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { API_BASE_URL } from '../../../config/constants';

const VehicleCard = ({ car, onSelectBook }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const hasEmbeddedImage = car.carImage?.length > 0;
    const imageSource = hasEmbeddedImage
        ? `data:${car.carImageType?.[0] || 'image/jpeg'};base64,${car.carImage[0]}`
        : `${API_BASE_URL.replace(/\/$/, '')}/api/cars/${car.id}/image/0`;

    const handleBookClick = () => {
        if (!user) {
            // Redirect unauthenticated guests to login page
            navigate('/login');
        } else {
            // Proceed with booking modal for logged-in users
            onSelectBook(car);
        }
    };

    return (
        <div className="car-card">
            <div className="vehicle-image-container">
                {car.id ? (
                    <img
                        src={imageSource}
                        alt={`${car.brand} ${car.model}`}
                        className="vehicle-image"
                        onError={(event) => {
                            event.currentTarget.style.display = 'none';
                            event.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div className="vehicle-image-placeholder" style={{ display: hasEmbeddedImage ? 'none' : 'flex' }}>No Image Available</div>
            </div>

            <div className="car-details">
                <h3 className="car-title">{car.brand} {car.model}</h3>
                <p className="car-meta">{car.fuelType} • {car.transmission}</p>

                <div className="car-footer">
                    <div className="car-price">
                        <span className="price-amount">₹{Number(car.dailyRate || 0).toLocaleString('en-IN')}</span>
                        <span className="price-period">/ day</span>
                    </div>

                    <button
                        onClick={handleBookClick}
                        className="btn btn-primary btn-sm"
                        disabled={!car.isAvailable}
                    >
                        {car.isAvailable ? 'Book Now' : 'Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;