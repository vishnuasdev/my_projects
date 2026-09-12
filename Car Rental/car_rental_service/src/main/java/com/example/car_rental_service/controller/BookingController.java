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
    public ResponseEntity<Booking> getBookingById(
            @PathVariable @Positive Long id,
            Authentication authentication) {
        boolean isAdmin = hasAuthority(authentication, "ADMIN");
        var booking = isAdmin
                ? bookingService.getBookingById(id)
                : hasAuthority(authentication, "CUSTOMER")
                    ? bookingService.getBookingByIdForCustomer(id, authentication.getName())
                    : hasAuthority(authentication, "AGENCY")
                        ? bookingService.getBookingByIdForAgency(id, authentication.getName())
                        : java.util.Optional.<Booking>empty();
        return booking
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Booking>> getBookingsByCustomer(
            @PathVariable @Positive Long customerId,
            Authentication authentication) {
        return ResponseEntity.ok(hasAuthority(authentication, "ADMIN")
                ? bookingService.getBookingsByCustomer(customerId)
                : bookingService.getBookingsByCustomerForUser(customerId, authentication.getName()));
    }

    @GetMapping("/car/{carId}")
    public ResponseEntity<List<Booking>> getBookingsByCar(
            @PathVariable @Positive Long carId,
            Authentication authentication) {
        return ResponseEntity.ok(hasAuthority(authentication, "ADMIN")
                ? bookingService.getBookingsByCar(carId)
                : bookingService.getBookingsByCarForOwner(carId, authentication.getName()));
    }

    @GetMapping("/agency/{agencyId}")
    public ResponseEntity<List<Booking>> getBookingsByAgency(
            @PathVariable @Positive Long agencyId,
            Authentication authentication) {
        return ResponseEntity.ok(hasAuthority(authentication, "ADMIN")
                ? bookingService.getBookingsByAgency(agencyId)
                : bookingService.getBookingsByAgencyForUser(agencyId, authentication.getName()));
    }

    private boolean hasAuthority(Authentication authentication, String authority) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(granted -> authority.equals(granted.getAuthority())
                        || ("ROLE_" + authority).equals(granted.getAuthority()));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable @Positive Long id,
            Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMIN") || a.getAuthority().equals("ROLE_ADMIN"));
        boolean cancelled = isAdmin
                ? bookingService.cancelBooking(id)
                : (authentication != null && bookingService.cancelBooking(id, authentication.getName()));
        if (cancelled) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}