package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.enums.BidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface CarRepository extends JpaRepository<Car, Long> {

    @Query("""
        SELECT DISTINCT c FROM Car c
        WHERE c.isAvailable = true
          AND (
              EXISTS (
                  SELECT b.id FROM Bid b
                  WHERE b.car = c
                    AND b.status = :status
              )
              OR (
                  c.bidStatus = :status
              )
          )
        """)
    List<Car> findAvailableCarsForApprovedAgencies(@Param("status") BidStatus status);

    List<Car> findByIsAvailableTrueAndBidStatus(BidStatus status);

    List<Car> findByAgencyId(Long agencyId);

    List<Car> findByOwnerId(Long ownerId);

    List<Car> findByAgencyIdAndBidStatus(Long agencyId, BidStatus status);

    @Query("SELECT DISTINCT c FROM Car c LEFT JOIN FETCH c.images WHERE c.id = :id")
    Optional<Car> findByIdWithImages(@Param("id") Long id);

    Optional<Car> findByIdAndAgencyId(Long id, Long agencyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Car c WHERE c.id = :id")
    Optional<Car> findByIdForUpdate(@Param("id") Long id);

    List<Car> findByAgencyIdAndIsAvailable(Long agencyId, Boolean isAvailable);
}