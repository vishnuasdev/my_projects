package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.CarImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CarImageRepository extends JpaRepository<CarImage, Long> {

}