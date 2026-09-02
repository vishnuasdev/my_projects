package com.example.car_rental_service.controller.users;

import com.example.car_rental_service.model.dto.response.UserResponse;
import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.users.Owner;
import com.example.car_rental_service.service.BidService;
import com.example.car_rental_service.service.CarService;
import com.example.car_rental_service.service.OwnerService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpHeaders;
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
@RequestMapping("/api/owner")
@PreAuthorize("hasAuthority('OWNER')")
@Validated
public class OwnerController {

    private final CarService carService;
    private final OwnerService ownerService;
    private final BidService bidService;

    public OwnerController(CarService carService, OwnerService ownerService, BidService bidService) {
        this.carService = carService;
        this.ownerService = ownerService;
        this.bidService = bidService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Owner> createOwner(
            @RequestPart("owner") @Valid Owner owner,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        Owner created = ownerService.createOwner(owner, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Owner>> getAllOwners() {
        return ResponseEntity.ok(ownerService.getAllOwners());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Owner> getOwnerById(@PathVariable @Positive Long id) {
        return ownerService.getOwnerById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getOwnerImage(@PathVariable @Positive Long id) {
        Owner owner = ownerService.getOwnerById(id)
                .orElseThrow(() -> new RuntimeException("Owner not found with ID: " + id));

        byte[] imageData = ownerService.getOwnerImage(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(owner.getImageType() != null ? owner.getImageType() : "image/jpeg"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"owner-" + id + "\"")
                .body(imageData);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Owner> updateOwner(
            @PathVariable @Positive Long id,
            @RequestPart("owner") @Valid Owner owner,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        Owner updated = ownerService.updateOwner(id, owner, image);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Owner> patchOwner(
            @PathVariable @Positive Long id,
            @RequestBody Owner owner) {
        Owner patched = ownerService.patchOwner(id, owner);
        return ResponseEntity.ok(patched);
    }

    @PatchMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Owner> updateOwnerImage(
            @PathVariable @Positive Long id,
            @RequestPart("image") MultipartFile image) throws IOException {
        Owner updated = ownerService.updateOwnerImage(id, image);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOwner(@PathVariable @Positive Long id) {
        boolean deleted = ownerService.deleteOwner(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
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

    // --- CAR MANAGEMENT ---

    @GetMapping("/cars")
    public ResponseEntity<List<Car>> getMyCars() {
        return ResponseEntity.ok(carService.getCarsForCurrentOwner());
    }

    @PostMapping(value = "/cars", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Car> addCar(
            @Valid @RequestPart("car") Car car,
            @RequestParam(value = "agencyId", required = false) Long agencyId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {
        Car savedCar = carService.addCar(car, agencyId, images);
        return new ResponseEntity<>(savedCar, HttpStatus.CREATED);
    }

    @PutMapping(value = "/cars/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Car> updateCar(
            @PathVariable @Positive Long id,
            @Valid @RequestPart("car") Car car,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {
        Car updated = carService.updateCar(id, car, images);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/cars/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable @Positive Long id) {
        if (carService.deleteCar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/cars/{id}/availability")
    public ResponseEntity<Car> toggleCarAvailability(
            @PathVariable @Positive Long id,
            @RequestParam boolean isAvailable) {
        return ResponseEntity.ok(carService.toggleCarAvailability(id, isAvailable));
    }

    // --- PROFILE MANAGEMENT ---

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        return ownerService.getOwnerByUserEmail(authentication.getName())
                .map(owner -> {
                    UserResponse response = new UserResponse();
                    response.setId(owner.getId());
                    response.setName(owner.getName());
                    if (owner.getUser() != null) {
                        response.setEmail(owner.getUser().getEmail());
                    }
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Owner> updateProfile(
            @Valid @RequestPart("owner") Owner ownerData,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        try {
            Owner updated = ownerService.updateOwnerProfile(authentication.getName(), ownerData, image);
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/profile/image/{ownerId}")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable @Positive Long ownerId) {
        return ownerService.getOwnerByUserId(ownerId)
                .filter(owner -> owner.getProfileImage() != null && owner.getProfileImage().length > 0)
                .map(owner -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(
                            owner.getImageType() != null ? owner.getImageType() : MediaType.IMAGE_JPEG_VALUE
                    ));
                    return new ResponseEntity<>(owner.getProfileImage(), headers, HttpStatus.OK);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    //BIDS OWNER SERVICES
    @PostMapping("/place")
    public ResponseEntity<Bid> placeBid(@RequestBody Bid bid) {
        Bid savedBid = bidService.placeBid(bid);
        return new ResponseEntity<>(savedBid, HttpStatus.CREATED);
    }

    @GetMapping("/car/{carId}")
    public ResponseEntity<List<Bid>> getBidsByCar(@PathVariable Long carId) {
        List<Bid> bids = bidService.getBidsByCar(carId);
        return ResponseEntity.ok(bids);
    }
}