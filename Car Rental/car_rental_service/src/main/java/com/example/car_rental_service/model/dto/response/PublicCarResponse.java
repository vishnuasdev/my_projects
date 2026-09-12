package com.example.car_rental_service.model.dto.response;

import com.example.car_rental_service.model.entity.Car;

public record PublicCarResponse(
        Long id,
        String brand,
        String model,
        String fuelType,
        String transmission,
        String type,
        Double dailyRate,
        String description,
        boolean isAvailable,
        int imageCount
) {
    public static PublicCarResponse from(Car car) {
        return new PublicCarResponse(
                car.getId(),
                car.getBrand(),
                car.getModel(),
                car.getFuelType(),
                car.getTransmission(),
                car.getType(),
                car.getDailyRate(),
                car.getDescription(),
                car.isAvailable(),
                car.getImageCount()
        );
    }
}
