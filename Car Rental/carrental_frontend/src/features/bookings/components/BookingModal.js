import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const BookingModal = ({ isOpen, onClose, vehicle, onSubmit }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!vehicle) return null;

    const calculateDays = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysCount = calculateDays();
    const totalPrice = daysCount * Number(vehicle.dailyRate || 0);
    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (daysCount <= 0) {
            setError('End date must be after the start date.');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({
                carId: vehicle.id,
                startDate,
                endDate,
                totalAmount: totalPrice,
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit booking request.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Book ${vehicle.brand} ${vehicle.model}`}>
            <form onSubmit={handleSubmit}>
                {error && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                <Input
                    label="Pick-up Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={today}
                    required
                />
                <Input
                    label="Return Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    required
                />

                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span>Daily Rate:</span>
                        <span>₹{Number(vehicle.dailyRate || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span>Rental Duration:</span>
                        <span>{daysCount} days</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem' }}>
                        <span>Total Cost:</span>
                        <span style={{ color: '#2563eb' }}>₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={isLoading} disabled={daysCount <= 0}>
                        Confirm Booking
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default BookingModal;