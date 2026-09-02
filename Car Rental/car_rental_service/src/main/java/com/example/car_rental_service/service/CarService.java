package com.example.car_rental_service.service;

import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.CarImage;
import com.example.car_rental_service.model.enums.BidStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface CarService {

    Car addCar(Car car, Long targetAgencyId, List<MultipartFile> images) throws IOException;

    Car updateCar(Long id, Car updatedCar, List<MultipartFile> newImages) throws IOException;

    Car processAgencyBid(Long carId, BidStatus status, String remarks);

    CarImage getCarImageByIndex(Long carId, int index);

    List<Car> getAllAvailableApprovedCars();

    List<Car> getCarsByAgency(Long agencyId);

    List<Car> getCarsByOwner(Long ownerId);

    List<Car> getCarsForCurrentOwner();

    Car getCarById(Long id);

    Car toggleCarAvailability(Long id, boolean isAvailable);

    boolean deleteCar(Long id);

    List<Car> getAllAvailableCars();

    List<Car> getAllCars();
}