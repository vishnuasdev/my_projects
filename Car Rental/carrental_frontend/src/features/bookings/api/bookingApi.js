import API from '../../../services/axiosInstance';

export const bookingApi = {
    createBooking: async (bookingData) => {
        const response = await API.post('/api/customer/bookings', bookingData);
        return response.data;
    },

    getBookingById: async (bookingId) => {
        const response = await API.get(`/api/customer/bookings/${bookingId}`);
        return response.data;
    },

    getCustomerBookings: async () => {
        const response = await API.get('/api/customer/bookings/my-bookings');
        return response.data;
    },

    getCarBookings: async (carId) => {
        const response = await API.get(`/api/bookings/car/${carId}`);
        return response.data;
    },

    getAgencyBookings: async (agencyId) => {
        const response = await API.get(`/api/bookings/agency/${agencyId}`);
        return response.data;
    },

    updateBookingStatus: async (bookingId, status) => {
        const response = await API.patch(`/api/bookings/${bookingId}/status`, null, { params: { status } });
        return response.data;
    },

    cancelBooking: async (bookingId) => {
        const response = await API.patch(`/api/customer/bookings/${bookingId}/cancel`);
        return response.data;
    },
};