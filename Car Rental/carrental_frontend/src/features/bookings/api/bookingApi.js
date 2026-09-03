import API from '../../../services/axiosInstance';

export const bookingApi = {
    createBooking: async (bookingData) => {
        const response = await API.post('/bookings/create', bookingData);
        return response.data;
    },

    getBookingById: async (bookingId) => {
        const response = await API.get(`/bookings/${bookingId}`);
        return response.data;
    },

    getCustomerBookings: async () => {
        const response = await API.get('/customers/my-bookings');
        return response.data;
    },

    getCarBookings: async (carId) => {
        const response = await API.get(`/bookings/car/${carId}`);
        return response.data;
    },

    getAgencyBookings: async (agencyId) => {
        const response = await API.get(`/bookings/agency/${agencyId}`);
        return response.data;
    },

    updateBookingStatus: async (bookingId, status) => {
        const response = await API.patch(`/bookings/${bookingId}/status`, null, { params: { status } });
        return response.data;
    },

    cancelBooking: async (bookingId) => {
        const response = await API.patch(`/bookings/${bookingId}/cancel`);
        return response.data;
    },
};