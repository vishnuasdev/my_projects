package com.example.car_rental_service.controller.users;

import com.example.car_rental_service.model.dto.request.OwnerBidRequest;
import com.example.car_rental_service.model.dto.response.UserResponse;
import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.users.Owner;
import com.example.car_rental_service.repository.AgencyRepository;
import com.example.car_rental_service.repository.CarRepository;
import com.example.car_rental_service.service.AgencyService;
import com.example.car_rental_service.service.BidService;
import com.example.car_rental_service.service.CarService;
import com.example.car_rental_service.service.OwnerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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
    private final AgencyService agencyService;
    private final AgencyRepository agencyRepository;
    private final CarRepository carRepository;

    public OwnerController(CarService carService, OwnerService ownerService, BidService bidService, AgencyService agencyService, AgencyRepository agencyRepository, CarRepository carRepository) {

        this.carService = carService;
        this.ownerService = ownerService;
        this.bidService = bidService;
        this.agencyService = agencyService;
        this.agencyRepository = agencyRepository;
        this.carRepository = carRepository;
    }

    // ============================================================
    // OWNER MANAGEMENT
    // ============================================================

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Owner> createOwner(@RequestPart("owner") @Valid Owner owner, @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        Owner created = ownerService.createOwner(owner, image);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Owner>> getAllOwners() {

        return ResponseEntity.ok(ownerService.getAllOwners());
    }

    /*
     * IMPORTANT:
     * Restrict {id} to digits.
     *
     * This prevents:
     * /api/owner/profile
     *
     * from being interpreted as:
     * /api/owner/{id}
     */
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Owner> getOwnerById(@PathVariable @Positive Long id) {

        return ownerService.getOwnerById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ============================================================
    // OWNER SELF PROFILE
    // ============================================================

    /*
     * ONLY ONE GET /profile METHOD.
     *
     * The logged-in owner is identified from JWT Authentication.
     * No owner ID is accepted from the frontend.
     */
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {

        return ownerService.getOwnerByUserEmail(authentication.getName()).map(owner -> {

            UserResponse response = new UserResponse();

            response.setId(owner.getId());
            response.setDob(owner.getDob());
            response.setLocation(owner.getLocation());
            response.setAddress(owner.getAddress());
            response.setHasProfileImage(owner.getProfileImage() != null && owner.getProfileImage().length > 0);

            if (owner.getUser() != null) {
                response.setEmail(owner.getUser().getEmail());
                response.setName(owner.getUser().getName());
                response.setPhone(owner.getUser().getPhoneNumber());
            }

            return ResponseEntity.ok(response);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /*
     * Update logged-in owner's profile.
     *
     * Identity comes from JWT, not from ownerData.user/id.
     */
    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestPart("owner") Owner ownerData, @RequestPart(value = "image", required = false) MultipartFile image, Authentication authentication) {

        try {

            UserResponse response = new UserResponse();

            Owner updated = ownerService.updateOwnerProfile(authentication.getName(), ownerData, image);

            response.setId(updated.getId());
            response.setDob(updated.getDob());
            response.setLocation(updated.getLocation());
            response.setAddress(updated.getAddress());
            response.setHasProfileImage(updated.getProfileImage() != null && updated.getProfileImage().length > 0);

            if (updated.getUser() != null) {
                response.setEmail(updated.getUser().getEmail());
                response.setName(updated.getUser().getName());
                response.setPhone(updated.getUser().getPhoneNumber());
            }

            return ResponseEntity.ok(response);

        } catch (IOException e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /*
     * Get logged-in owner's profile image.
     *
     * No ownerId is required.
     */
    @GetMapping("/profile/image")
    public ResponseEntity<byte[]> getMyProfileImage(Authentication authentication) {

        return ownerService.getOwnerByUserEmail(authentication.getName()).filter(owner -> owner.getProfileImage() != null && owner.getProfileImage().length > 0).map(owner -> {

            String contentType = owner.getImageType() != null ? owner.getImageType() : MediaType.IMAGE_JPEG_VALUE;

            HttpHeaders headers = new HttpHeaders();

            headers.setContentType(MediaType.parseMediaType(contentType));

            headers.setContentDispositionFormData("inline", "owner-" + owner.getId());

            return new ResponseEntity<>(owner.getProfileImage(), headers, HttpStatus.OK);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /*
     * Delete logged-in owner's profile image.
     *
     * This requires a corresponding service method:
     * ownerService.deleteOwnerProfileImage(email)
     */
@DeleteMapping("/profile/image")
public ResponseEntity<Void> deleteMyProfileImage() {
    ownerService.removeMyProfileImage();
    return ResponseEntity.noContent().build();
}

    // ============================================================
    // OWNER ID-BASED IMAGE
    // ============================================================

    /*
     * ID-based image endpoint.
     *
     * Numeric constraint is important.
     */
    @GetMapping("/{id:\\d+}/image")
    public ResponseEntity<byte[]> getOwnerImage(@PathVariable @Positive Long id) {

        Owner owner = ownerService.getOwnerById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found with ID: " + id));

        byte[] imageData = ownerService.getOwnerImage(id);

        if (imageData == null || imageData.length == 0) {
            return ResponseEntity.notFound().build();
        }

        String contentType = owner.getImageType() != null ? owner.getImageType() : MediaType.IMAGE_JPEG_VALUE;

        return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType)).header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"owner-" + id + "\"").body(imageData);
    }

    // ============================================================
    // OWNER ID-BASED UPDATE
    // ============================================================

    @PutMapping(value = "/{id:\\d+}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Owner> updateOwner(@PathVariable @Positive Long id, @RequestPart("owner") @Valid Owner owner, @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        Owner updated = ownerService.updateOwner(id, owner, image);

        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id:\\d+}")
    public ResponseEntity<Owner> patchOwner(@PathVariable @Positive Long id, @RequestBody Owner owner) {

        Owner patched = ownerService.patchOwner(id, owner);

        return ResponseEntity.ok(patched);
    }

    @PatchMapping(value = "/{id:\\d+}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Owner> updateOwnerImage(@PathVariable @Positive Long id, @RequestPart("image") MultipartFile image) throws IOException {

        Owner updated = ownerService.updateOwnerImage(id, image);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deleteOwner(@PathVariable @Positive Long id) {

        boolean deleted = ownerService.deleteOwner(id);

        if (deleted) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.notFound().build();
    }

    // ============================================================
    // CAR MANAGEMENT
    // ============================================================

    @GetMapping("/cars")
    public ResponseEntity<List<Car>> getMyCars() {

        return ResponseEntity.ok(carService.getCarsForCurrentOwner());
    }

    @PostMapping(value = "/cars", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Car> addCar(@Valid @RequestPart("car") Car car, @RequestParam(value = "agencyId", required = false) Long agencyId, @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {

        Car savedCar = carService.addCar(car, agencyId, images);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedCar);
    }

    @PutMapping(value = "/cars/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Car> updateCar(@PathVariable @Positive Long id, @Valid @RequestPart("car") Car car, @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {

        Car updated = carService.updateCar(id, car, images);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/cars/{id}/images/{index}")
    public ResponseEntity<Car> deleteCarImage(@PathVariable @Positive Long id, @PathVariable @PositiveOrZero int index) {

        return ResponseEntity.ok(carService.removeCarImage(id, index));
    }

    @DeleteMapping("/cars/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable @Positive Long id) {

        if (carService.deleteCar(id)) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/cars/{id}/availability")
    public ResponseEntity<Car> toggleCarAvailability(@PathVariable @Positive Long id, @RequestParam boolean isAvailable) {

        return ResponseEntity.ok(carService.toggleCarAvailability(id, isAvailable));
    }

    @PutMapping("/cars/{id}/recall")
    public ResponseEntity<Car> recallCarFromAgency(@PathVariable @Positive Long id) {

        return ResponseEntity.ok(carService.recallCarFromAgency(id));
    }

    // ============================================================
    // OWNER BIDS
    // ============================================================

    @PostMapping("/bids")
    public ResponseEntity<Bid> submitBid(@Valid @RequestBody OwnerBidRequest request, Authentication authentication) {

        Owner owner = ownerService.getOwnerByUserEmail(authentication.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner profile not found."));

        Car car = carRepository.findById(request.carId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found."));

        Agency agency = agencyRepository.findById(request.agencyId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agency not found."));

        /*
         * Only APPROVED agencies can receive bids.
         */
        if (agency.getStatus() != com.example.car_rental_service.model.enums.AgencyStatus.APPROVED) {

            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only approved agencies can receive bids.");
        }

        /*
         * Owner can bid only using their own car.
         */
        if (car.getOwner() == null || !owner.getId().equals(car.getOwner().getId())) {

            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only bid with your own car.");
        }

        Bid bid = new Bid();

        bid.setOwner(owner);
        bid.setCar(car);
        bid.setAgency(agency);
        bid.setRatePerDay(request.ratePerDay());

        return ResponseEntity.status(HttpStatus.CREATED).body(bidService.placeBid(bid));
    }

    @GetMapping("/bids")
    public ResponseEntity<List<Bid>> getMyBids(Authentication authentication) {

        return ResponseEntity.ok(bidService.getBidsByOwnerEmail(authentication.getName()));
    }

    @GetMapping("/cars/{carId}/bids")
    public ResponseEntity<List<Bid>> getMyCarBids(@PathVariable @Positive Long carId, Authentication authentication) {

        Owner owner = ownerService.getOwnerByUserEmail(authentication.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner profile not found."));

        Car car = carRepository.findById(carId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found."));

        if (car.getOwner() == null || !owner.getId().equals(car.getOwner().getId())) {

            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view bids for your own car.");
        }

        return ResponseEntity.ok(bidService.getBidsByCar(carId));
    }

    @DeleteMapping("/bids/{id}")
    public ResponseEntity<Void> cancelBid(@PathVariable @Positive Long id, Authentication authentication) {

        if (bidService.deleteBidByOwner(id, authentication.getName())) {

            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.notFound().build();
    }

    // ============================================================
    // AGENCIES
    // ============================================================

    @GetMapping("/agencies")
    public ResponseEntity<List<Agency>> getAgenciesForBidding() {

        return ResponseEntity.ok(agencyService.getAllAgencies());
    }
}