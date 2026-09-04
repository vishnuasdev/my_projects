package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.CarImage;
import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.entity.users.Owner;
import com.example.car_rental_service.model.enums.BidStatus;
import com.example.car_rental_service.repository.AgencyRepository;
import com.example.car_rental_service.repository.CarRepository;
import com.example.car_rental_service.repository.OwnerRepository;
import com.example.car_rental_service.service.CarService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class CarServiceImpl implements CarService {

    private final CarRepository carRepository;
    private final OwnerRepository ownerRepository;
    private final AgencyRepository agencyRepository;

    public CarServiceImpl(CarRepository carRepository,
                          OwnerRepository ownerRepository,
                          AgencyRepository agencyRepository) {
        this.carRepository = carRepository;
        this.ownerRepository = ownerRepository;
        this.agencyRepository = agencyRepository;
    }

    @Override
    public Car addCar(Car car, Long targetAgencyId, List<MultipartFile> images) throws IOException {
        Owner owner = getCurrentOwner();
        car.setOwner(owner);
        car.setAvailable(true);
        car.setBidStatus(BidStatus.PENDING);

        if (targetAgencyId != null) {
            Agency agency = agencyRepository.findById(targetAgencyId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target agency not found: " + targetAgencyId));
            car.setAgency(agency);
        }

        processAndAttachImages(car, images, false);
        return carRepository.save(car);
    }

    @Override
    public Car updateCar(Long id, Car updatedCar, List<MultipartFile> newImages) throws IOException {
        Car car = getCarById(id);
        validateOwnershipOrAdmin(car);

        car.setBrand(updatedCar.getBrand());
        car.setModel(updatedCar.getModel());
        car.setRegistrationNo(updatedCar.getRegistrationNo());
        car.setFuelType(updatedCar.getFuelType());
        car.setTransmission(updatedCar.getTransmission());
        car.setDailyRate(updatedCar.getDailyRate());
        car.setDescription(updatedCar.getDescription());

        if (newImages != null && !newImages.isEmpty()) {
            processAndAttachImages(car, newImages, true);
        }

        return carRepository.save(car);
    }

    @Override
    public Car processAgencyBid(Long carId, BidStatus status, String remarks) {
        Car car = getCarById(carId);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"));

        if (!isAdmin) {
            Agency agency = agencyRepository.findByUserEmail(auth.getName())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only designated agencies can accept/reject bids."));
            if (car.getAgency() == null || !car.getAgency().getId().equals(agency.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This car bid was not assigned to your agency.");
            }
        }

        car.setBidStatus(status);
        car.setAgencyRemarks(remarks);
        return carRepository.save(car);
    }

    @Override
    @Transactional(readOnly = true)
    public CarImage getCarImageByIndex(Long carId, int index) {
        Car car = carRepository.findByIdWithImages(carId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));

        if (index < 0 || index >= car.getImages().size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image index out of bounds");
        }

        return car.getImages().get(index);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Car> getAllAvailableApprovedCars() {
        return carRepository.findByIsAvailableTrueAndBidStatus(BidStatus.ACCEPTED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Car> getCarsByAgency(Long agencyId) {
        return carRepository.findByAgencyId(agencyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Car> getCarsByOwner(Long ownerId) {
        return carRepository.findByOwnerId(ownerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Car> getCarsForCurrentOwner() {
        return getCarsByOwner(getCurrentOwner().getId());
    }

    @Override
    @Transactional(readOnly = true)


    public Car getCarById(Long id) {
        return carRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found with ID: " + id));
    }

    @Override
    public Car toggleCarAvailability(Long id, boolean isAvailable) {
        Car car = getCarById(id);
        validateOwnershipOrAdmin(car);
        car.setAvailable(isAvailable);
        return carRepository.save(car);
    }

    @Override
    public boolean deleteCar(Long id) {
        Car car = getCarById(id);
        validateOwnershipOrAdmin(car);
        carRepository.delete(car);
        return true;
    }

    private void processAndAttachImages(Car car, List<MultipartFile> images, boolean append) throws IOException {
        if (car.getImages() == null) {
            car.setImages(new ArrayList<>());
        }

        if (!append) {
            car.getImages().clear();
        }

        if (images != null) {
            for (MultipartFile file : images) {
                if (!file.isEmpty()) {
                    if (car.getImages().size() >= 5) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot upload more than 5 images per car.");
                    }

                    String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

                    CarImage carImage = CarImage.builder()
                            .imageType(mimeType)
                            .imageData(file.getBytes())
                            .build();

                    car.addImage(carImage);
                }
            }
        }
    }

    private Owner getCurrentOwner() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return ownerRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner profile not found for authenticated user"));
    }

    private void validateOwnershipOrAdmin(Car car) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"));

        if (!isAdmin && (car.getOwner() == null || !car.getOwner().getId().equals(getCurrentOwner().getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have rights to alter this vehicle record.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Car> getAllAvailableCars() {
        return carRepository.findByIsAvailableTrueAndBidStatus(BidStatus.ACCEPTED);
    }

    @Override
    public List<Car> getAllCars() {
        return carRepository.findAll();
    }
}