package com.example.car_rental_service.controller.users;

import com.example.car_rental_service.model.dto.AgencyUpdateDto;
import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.entity.users.Owner;
import com.example.car_rental_service.model.enums.AgencyStatus;
import com.example.car_rental_service.model.enums.BookingStatus;
import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.model.enums.UserStatus;
import com.example.car_rental_service.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
@Validated
public class AdminController {

    private final UserService userService;
    private final CarService carService;
    private final BidService bidService;
    private final BookingService bookingService;
    private final AgencyService agencyService;
    private final OwnerService ownerService;

    public AdminController(UserService userService,
                           CarService carService,
                           BidService bidService,
                           BookingService bookingService,
                           AgencyService agencyService, OwnerService ownerService) {
        this.userService = userService;
        this.carService = carService;
        this.bidService = bidService;
        this.bookingService = bookingService;
        this.agencyService = agencyService;
        this.ownerService = ownerService;
    }

    // ==========================================
    // 1. USER MANAGEMENT
    // ==========================================

    @PostMapping("/users/register")
    public ResponseEntity<User> registerUser(@Valid @RequestBody User user) {
        User registeredUser = userService.registerUser(user);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable @Positive Long id) {
        User user = userService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/users/email")
    public ResponseEntity<User> getUserByEmail(@RequestParam("email") String email) {
        User user = userService.getUserByEmail(email);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/users/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @GetMapping("/users/status/{status}")
    public ResponseEntity<List<User>> getUsersByStatus(@PathVariable UserStatus status) {
        return ResponseEntity.ok(userService.getUsersByStatus(status));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable @Positive Long id,
            @RequestBody User updatedUser) {
        return ResponseEntity.ok(userService.updateUser(id, updatedUser));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<User> updateUserStatus(
            @PathVariable @Positive Long id,
            @RequestParam("status") UserStatus status) {
        return ResponseEntity.ok(userService.updateUserStatus(id, status));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable @Positive Long id,
            Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            userService.deleteUser(id, authentication.getName());
        } else {
            userService.deleteUser(id);
        }
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 2. AGENCY MANAGEMENT
    // ==========================================

    @GetMapping("/agencies")
    public ResponseEntity<List<Agency>> getAllAgencies(
            @RequestParam(required = false) AgencyStatus status) {
        if (status != null) {
            return ResponseEntity.ok(agencyService.getAgenciesByStatus(status));
        }
        return ResponseEntity.ok(agencyService.getAllAgencies());
    }

    @GetMapping("/agencies/{id}")
    public ResponseEntity<Agency> getAgencyById(@PathVariable @Positive Long id) {
        return agencyService.getAgencyById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/agencies/user/{userId}")
    public ResponseEntity<Agency> getAgencyByUserId(@PathVariable @Positive Long userId) {
        return agencyService.getAgencyByUserId(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/agencies/{id}")
    public ResponseEntity<Agency> updateAgency(
            @PathVariable @Positive Long id,
            @Valid @RequestBody AgencyUpdateDto updateDto) {
        return agencyService.updateAgencyByAdmin(id, updateDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/agencies/{id}")
    public ResponseEntity<Void> deleteAgency(@PathVariable @Positive Long id) {
        boolean deleted = agencyService.deleteAgencyByAdmin(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==========================================
    // 3. CAR MANAGEMENT
    // ==========================================

    @PostMapping(value = "/cars/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Car> addCar(
            @Valid @RequestPart("car") Car car,
            @RequestParam(value = "agencyId", required = false) Long agencyId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {
        Car savedCar = carService.addCar(car, agencyId, images);
        return new ResponseEntity<>(savedCar, HttpStatus.CREATED);
    }

    @GetMapping("/cars")
    public ResponseEntity<List<Car>> getAllCars() {
        return ResponseEntity.ok(carService.getAllCars());
    }

    @GetMapping("/cars/available")
    public ResponseEntity<List<Car>> getAllAvailableCars() {
        return ResponseEntity.ok(carService.getAllAvailableCars());
    }

    @GetMapping("/cars/{id}")
    public ResponseEntity<Car> getCarById(@PathVariable @Positive Long id) {
        Car car = carService.getCarById(id);
        if (car != null) {
            return ResponseEntity.ok(car);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/cars/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable @Positive Long id) {
        boolean deleted = carService.deleteCar(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==========================================
    // 4. BID MANAGEMENT
    // ==========================================

    @GetMapping("/bids")
    public ResponseEntity<List<Bid>> getAllBids() {
        return ResponseEntity.ok(bidService.getAllBids());
    }

    @GetMapping("/bids/{id}")
    public ResponseEntity<Bid> getBidById(@PathVariable @Positive Long id) {
        return bidService.getBidById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/bids/car/{carId}")
    public ResponseEntity<List<Bid>> getBidsByCar(@PathVariable @Positive Long carId) {
        return ResponseEntity.ok(bidService.getBidsByCar(carId));
    }

    @GetMapping("/bids/owner/{ownerId}")
    public ResponseEntity<List<Bid>> getBidsByOwner(@PathVariable @Positive Long ownerId) {
        return ResponseEntity.ok(bidService.getBidsByOwner(ownerId));
    }

    @GetMapping("/bids/agency/{agencyId}")
    public ResponseEntity<List<Bid>> getBidsByAgency(@PathVariable @Positive Long agencyId) {
        return ResponseEntity.ok(bidService.getBidsByAgency(agencyId));
    }

    // Place a new bid
    @PostMapping("/place")
    public ResponseEntity<Bid> placeBid(@RequestBody Bid bid) {
        Bid savedBid = bidService.placeBid(bid);
        return new ResponseEntity<>(savedBid, HttpStatus.CREATED);
    }

    @PatchMapping("/bids/{id}/status")
    public ResponseEntity<Bid> updateBidStatus(
            @PathVariable @Positive Long id,
            @RequestParam String status) {
        return bidService.updateBidStatus(id, status)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/bids/{id}")
    public ResponseEntity<Void> deleteBid(@PathVariable @Positive Long id) {
        boolean deleted = bidService.deleteBid(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==========================================
    // 5. BOOKING MANAGEMENT
    // ==========================================

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable @Positive Long id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<Booking> updateBookingStatus(
            @PathVariable @Positive Long id,
            @RequestParam BookingStatus status) {
        Booking updatedBooking = bookingService.updateBookingStatus(id, status);
        return ResponseEntity.ok(updatedBooking);
    }

    @PatchMapping("/bookings/{id}/cancel")
    public ResponseEntity<Void> forceCancelBooking(@PathVariable @Positive Long id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.noContent().build();
    }

    // --- ADMIN ENDPOINTS ---

    @PutMapping("/admin/{id}")
    public ResponseEntity<Owner> updateOwnerByAdmin(
            @PathVariable @Positive Long id,
            @RequestBody Owner owner) {
        return ownerService.updateOwnerByAdmin(id, owner)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteOwnerByAdmin(@PathVariable @Positive Long id) {
        boolean deleted = ownerService.deleteOwnerByAdmin(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}