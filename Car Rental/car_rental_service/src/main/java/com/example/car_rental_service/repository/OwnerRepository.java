package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.users.Owner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OwnerRepository extends JpaRepository<Owner, Long> {
    Optional<Owner> findByUserId(Long userId);

    @Query("SELECT o FROM Owner o WHERE o.user.email = :email")
    Optional<Owner> findByEmail(@Param("email") String email);

    Optional<Owner> findByUserEmail(String email);



}