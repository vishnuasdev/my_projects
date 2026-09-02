package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.users.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByUserId(Long userId);

    Optional<Customer> findByUserEmail(String email);

    boolean existsByUserEmail(String email);
}