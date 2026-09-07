package com.example.car_rental_service.controller.users;

import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.enums.BookingStatus;
import com.example.car_rental_service.service.AgencyService;
import com.example.car_rental_service.service.BidService;
import com.example.car_rental_service.service.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/agency")
public class AgencyController {

    private final AgencyService agencyService;
    private final BookingService bookingService;
    private final BidService bidService;

    public AgencyController(AgencyService agencyService, BookingService bookingService, BidService bidService) {
        this.agencyService = agencyService;
        this.bookingService = bookingService;
        this.bidService = bidService;
    }

    //Agency API
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Agency> createAgency(
            @RequestPart("agency") @Valid Agency agency,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        Agency created = agencyService.createAgency(agency, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Agency> getAgencyById(@PathVariable @Positive Long id) {
        return agencyService.getAgencyById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/profile")
    public ResponseEntity<Agency> getMyProfile() {
        return ResponseEntity.ok(agencyService.getMyProfile());
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getAgencyImage(@PathVariable @Positive Long id) {
        Agency agency = agencyService.getAgencyById(id)
                .orElseThrow(() -> new RuntimeException("Agency not found with ID: " + id));

        byte[] imageData = agencyService.getAgencyImage(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(agency.getImageType() != null ? agency.getImageType() : "image/jpeg"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"agency-" + id + "\"")
                .body(imageData);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Agency> updateAgency(
            @PathVariable @Positive Long id,
            @RequestPart("agency") @Valid Agency agency,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        Agency updated = agencyService.updateAgency(id, agency, image);
        return ResponseEntity.ok(updated);
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Agency> updateMyProfile(
            @RequestPart("agency") @Valid Agency agency,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        return ResponseEntity.ok(agencyService.updateMyProfile(agency, image));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Agency> patchAgency(
            @PathVariable @Positive Long id,
            @RequestBody Agency agency) {
        Agency patched = agencyService.patchAgency(id, agency);
        return ResponseEntity.ok(patched);
    }

    @PatchMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Agency> updateAgencyImage(
            @PathVariable @Positive Long id,
            @RequestPart("image") MultipartFile image) throws IOException {
        Agency updated = agencyService.updateAgencyImage(id, image);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAgency(@PathVariable @Positive Long id) {
        boolean deleted = agencyService.deleteAgency(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // 1. Get Cars Owned/Managed strictly by the Logged-in Agency
    @GetMapping("/cars")
    public ResponseEntity<List<Car>> getMyAgencyCars() {
        return ResponseEntity.ok(agencyService.getMyAgencyCars());
    }

    // 2. Toggle Availability of an Agency Car
    @PatchMapping("/cars/{carId}/availability")
    public ResponseEntity<Car> toggleCarAvailability(@PathVariable Long carId, @RequestParam boolean available) {
        return ResponseEntity.ok(agencyService.updateMyAgencyCarAvailability(carId, available));
    }

    // 3. View Bids Accepted by Owners for Agency Cars
    @GetMapping("/bids/accepted")
    public ResponseEntity<List<Bid>> getAcceptedBids() {
        return ResponseEntity.ok(agencyService.getAcceptedBids());
    }

    @GetMapping("/bids")
    public ResponseEntity<List<Bid>> getMyBids() {
        return ResponseEntity.ok(agencyService.getMyBids());
    }

    // 4. View Customer Bookings for Agency Cars
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getCustomerBookings() {
        return ResponseEntity.ok(agencyService.getCustomerBookingsForAgency());
    }

    // 5. Manage Customer Booking Request Status (CONFIRMED, REJECTED, COMPLETED)
    @PatchMapping("/bookings/{bookingId}/status")
    public ResponseEntity<Booking> updateBookingStatus(@PathVariable Long bookingId, @RequestParam BookingStatus status) {
        return ResponseEntity.ok(agencyService.updateBookingStatus(bookingId, status));
    }

    //Booking Management by Agency
    @GetMapping("/agency-cars")
    public ResponseEntity<List<Booking>> getBookingsForAgencyCars() {
        return ResponseEntity.ok(bookingService.getBookingsForAgencyCars());
    }

    // Update bid status (e.g., ACCEPTED, REJECTED, WAITING)
    @PatchMapping("/bids/{id}/status")
    public ResponseEntity<Bid> updateBidStatus(@PathVariable Long id, @RequestParam String status) {
        return bidService.updateBidStatus(id, status)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Get all bids for a specific agency
    @GetMapping("/agency/{agencyId}")
    public ResponseEntity<List<Bid>> getBidsByAgency(@PathVariable Long agencyId) {
        List<Bid> bids = bidService.getBidsByAgency(agencyId);
        return ResponseEntity.ok(bids);
    }
}