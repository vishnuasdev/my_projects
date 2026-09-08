package com.example.car_rental_service.service;

import com.example.car_rental_service.model.entity.Bid;

import java.util.List;
import java.util.Optional;

public interface BidService {
    List<Bid> getAllBids();
    Bid placeBid(Bid bid);
    List<Bid> getBidsByOwnerEmail(String email);
    boolean deleteBidByOwner(Long id, String email);
    Optional<Bid> updateBidStatus(Long id, String status);
    Optional<Bid> getBidById(Long id);
    List<Bid> getBidsByCar(Long carId);
    List<Bid> getBidsByAgency(Long agencyId);
    List<Bid> getBidsByOwner(Long ownerId);
    boolean deleteBid(Long id);
}