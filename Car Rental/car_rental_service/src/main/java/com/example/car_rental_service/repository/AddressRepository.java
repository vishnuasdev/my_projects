package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByCity(String city);
    List<Address> findByPincode(String pincode);
}