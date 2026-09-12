package com.example.car_rental_service.controller.users;

import com.example.car_rental_service.model.dto.response.UserResponse;
import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.enums.BookingStatus;
import com.example.car_rental_service.service.AgencyService;
import com.example.car_rental_service.service.BidService;
import com.example.car_rental_service.service.BookingService;
import com.example.car_rental_service.service.CarService;
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
import java.util.Objects;

@RestController
@RequestMapping("/api/agency")
public class AgencyController {

    private final AgencyService agencyService;
    private final BookingService bookingService;
    private final BidService bidService;
    private final CarService carService;

    public AgencyController(AgencyService agencyService, BookingService bookingService, BidService bidService, CarService carService) {
        this.agencyService = agencyService;
        this.bookingService = bookingService;
        this.bidService = bidService;
        this.carService = carService;
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
    public ResponseEntity<UserResponse> getMyProfile() {
        return ResponseEntity.ok(toProfileResponse(agencyService.getMyProfile()));
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateMyProfile(
            @RequestPart("agency") @Valid Agency agency,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        return ResponseEntity.ok(toProfileResponse(agencyService.updateMyProfile(agency, image)));
    }

    private UserResponse toProfileResponse(Agency agency) {
        UserResponse response = new UserResponse();
        response.setId(agency.getId());
        response.setName(agency.getName());
        response.setLocation(agency.getLocation());
        response.setAddress(agency.getAddress());
        response.setHasProfileImage(agency.getProfileImage() != null && agency.getProfileImage().length > 0);
        if (agency.getUser() != null) {
            response.setEmail(agency.getUser().getEmail());
            response.setPhone(agency.getUser().getPhoneNumber());
        }
        return response;
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

    @GetMapping("/profile/image")
    public ResponseEntity<byte[]> getMyProfileImage() {
        Agency agency = agencyService.getMyProfile();
        if (agency.getProfileImage() == null || agency.getProfileImage().length == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        agency.getImageType() != null ? agency.getImageType() : MediaType.IMAGE_JPEG_VALUE))
                .body(agency.getProfileImage());
    }

    @DeleteMapping("/profile/image")
    public ResponseEntity<Void> removeMyProfileImage() {
        agencyService.removeMyProfileImage();
        return ResponseEntity.noContent().build();
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

    // 2b. Edit an Agency-Managed Car (bid must be ACCEPTED)
    @PutMapping(value = "/cars/{carId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Car> updateAgencyCar(
            @PathVariable @Positive Long carId,
            @Valid @RequestPart("car") Car car,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {
        return ResponseEntity.ok(carService.updateCarByAgency(carId, car, images));
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
        Bid bid = bidService.getBidById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Bid not found"));
        Agency agency = agencyService.getMyProfile();
        if (agency.getStatus() != com.example.car_rental_service.model.enums.AgencyStatus.APPROVED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only approved agencies can update bids.");
        }
        if (bid.getAgency() == null || !Objects.equals(bid.getAgency().getId(), agency.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You can only update bids assigned to your agency.");
        }
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