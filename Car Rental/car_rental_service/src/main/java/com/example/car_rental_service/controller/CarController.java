package com.example.car_rental_service.controller;

import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.CarImage;
import com.example.car_rental_service.model.enums.BidStatus;
import com.example.car_rental_service.service.CarService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/cars")
@Validated
public class CarController {

    private final CarService carService;

    public CarController(CarService carService) {
        this.carService = carService;
    }

    @PostMapping(value = "/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Car> addCar(
            @Valid @RequestPart("car") Car car,
            @RequestParam(value = "agencyId", required = false) Long agencyId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {
        Car savedCar = carService.addCar(car, agencyId, images);
        return new ResponseEntity<>(savedCar, HttpStatus.CREATED);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Car> updateCar(
            @PathVariable @Positive Long id,
            @Valid @RequestPart("car") Car car,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {
        return ResponseEntity.ok(carService.updateCar(id, car, images));
    }

    @PatchMapping("/{id}/bid-status")
    public ResponseEntity<Car> updateBidStatus(
            @PathVariable @Positive Long id,
            @RequestParam BidStatus status,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(carService.processAgencyBid(id, status, remarks));
    }

    @GetMapping("/{id}/image/{index}")
    public ResponseEntity<byte[]> getCarImage(
            @PathVariable @Positive Long id,
            @PathVariable @PositiveOrZero int index) {
        CarImage image = carService.getCarImageByIndex(id, index);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(image.getImageType()));
        return new ResponseEntity<>(image.getImageData(), headers, HttpStatus.OK);
    }

    // public method this only
    @GetMapping("/available")
    public ResponseEntity<List<Car>> getAllAvailableCars() {
        return ResponseEntity.ok(carService.getAllAvailableApprovedCars());
    }

    @GetMapping("/my-cars")
    public ResponseEntity<List<Car>> getMyCars() {
        return ResponseEntity.ok(carService.getCarsForCurrentOwner());
    }

    @GetMapping("/agency/{agencyId}")
    public ResponseEntity<List<Car>> getCarsByAgency(@PathVariable @Positive Long agencyId) {
        return ResponseEntity.ok(carService.getCarsByAgency(agencyId));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Car>> getCarsByOwner(@PathVariable @Positive Long ownerId) {
        return ResponseEntity.ok(carService.getCarsByOwner(ownerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Car> getCarById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(carService.getCarById(id));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<Car> toggleAvailability(
            @PathVariable @Positive Long id,
            @RequestParam boolean isAvailable) {
        return ResponseEntity.ok(carService.toggleCarAvailability(id, isAvailable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable @Positive Long id) {
        carService.deleteCar(id);
        return ResponseEntity.noContent().build();
    }
}