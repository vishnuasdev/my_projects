package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.enums.BidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByAgencyId(Long agencyId);
    List<Bid> findByOwnerId(Long ownerId);
    List<Bid> findByCarId(Long carId);
    List<Bid> findByStatus(BidStatus status);
    List<Bid> findByAgencyIdAndStatus(Long agencyId, BidStatus status);
    @Query("SELECT b FROM Bid b WHERE b.car.id = :carId AND b.status = :status ORDER BY b.id DESC")
    List<Bid> findLatestByCarIdAndStatus(
            @Param("carId") Long carId,
            @Param("status") BidStatus status);
}
