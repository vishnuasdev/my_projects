package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.enums.AgencyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, Long> {

    @Override
    @EntityGraph(attributePaths = {"user", "address"})
    List<Agency> findAll();
    Optional<Agency> findByUserId(Long userId);
    Optional<Agency> findByUserEmail(String email);
    List<Agency> findByStatus(AgencyStatus status);
}
