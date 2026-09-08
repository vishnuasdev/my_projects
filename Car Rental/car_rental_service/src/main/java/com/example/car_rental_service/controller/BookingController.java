package com.example.car_rental_service.controller;

import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.enums.BookingStatus;
import com.example.car_rental_service.service.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@Validated
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/create")
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody Booking booking) {
        if (booking.getCar() == null || booking.getCar().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        Booking savedBooking = bookingService.createBookingRequest(booking.getCar().getId(), booking);
        return new ResponseEntity<>(savedBooking, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Booking> updateBookingStatus(
            @PathVariable @Positive Long id,
            @RequestParam BookingStatus status) {
        Booking updatedBooking = bookingService.updateBookingStatus(id, status);
        return ResponseEntity.ok(updatedBooking);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable @Positive Long id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Booking>> getBookingsByCustomer(@PathVariable @Positive Long customerId) {
        return ResponseEntity.ok(bookingService.getBookingsByCustomer(customerId));
    }

    @GetMapping("/car/{carId}")
    public ResponseEntity<List<Booking>> getBookingsByCar(@PathVariable @Positive Long carId) {
        return ResponseEntity.ok(bookingService.getBookingsByCar(carId));
    }

    @GetMapping("/agency/{agencyId}")
    public ResponseEntity<List<Booking>> getBookingsByAgency(@PathVariable @Positive Long agencyId) {
        return ResponseEntity.ok(bookingService.getBookingsByAgency(agencyId));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable @Positive Long id,
            Authentication authentication) {
        if (bookingService.cancelBooking(id, authentication.getName())) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}