package com.example.car_rental_service.service;

import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.enums.BookingStatus;

import java.util.List;
import java.util.Optional;

public interface BookingService {
    Booking createBooking(Booking booking);
    Booking createBooking(Booking booking, String userEmail);
    List<Booking> getBookingsByCustomer(Long customerId);
    List<Booking> getBookingsByUserEmail(String email);
    List<Booking> getBookingsByCar(Long carId);
    List<Booking> getBookingsByAgency(Long agencyId);
    boolean cancelBooking(Long id);
    boolean cancelBooking(Long id, String userEmail);

    // Customer operations
    Booking createBookingRequest(Long carId, Booking bookingRequest);
    List<Booking> getMyBookings();

    // Agency / System operations
    List<Booking> getBookingsForAgencyCars();
    Booking updateBookingStatus(Long id, BookingStatus status);

    Optional<Booking> getBookingById(Long id);
    List<Booking> getAllBookings();
}