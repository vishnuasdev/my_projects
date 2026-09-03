package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.enums.BidStatus;
import com.example.car_rental_service.repository.BidRepository;
import com.example.car_rental_service.service.BidService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BidServiceImpl implements BidService {

    private final BidRepository bidRepository;

    public BidServiceImpl(BidRepository bidRepository) {
        this.bidRepository = bidRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bid> getAllBids() {
        return bidRepository.findAll();
    }


    @Override
    @Transactional
    public Bid placeBid(Bid bid) {
        if (bid.getRatePerDay() == null || bid.getRatePerDay() <= 0) {
            throw new IllegalArgumentException("Bid amount must be greater than zero.");
        }
        bid.setStatus(BidStatus.PENDING);
        return bidRepository.save(bid);
    }

    @Override
    @Transactional
    public Optional<Bid> updateBidStatus(Long id, String status) {
        Optional<Bid> optionalBid = bidRepository.findById(id);

        if (optionalBid.isEmpty()) {
            return Optional.empty();
        }

        Bid bid = optionalBid.get();
        try {
            BidStatus nextStatus = BidStatus.valueOf(status.toUpperCase().trim());
            bid.setStatus(nextStatus);
            if (nextStatus == BidStatus.ACCEPTED && bid.getCar() != null) {
                bid.getCar().setBidStatus(BidStatus.ACCEPTED);
                bid.getCar().setAvailable(true);
            }
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Invalid BidStatus provided: " + status);
        }

        return Optional.of(bidRepository.save(bid));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Bid> getBidById(Long id) {
        return bidRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bid> getBidsByCar(Long carId) {
        return bidRepository.findByCarId(carId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bid> getBidsByAgency(Long agencyId) {
        return bidRepository.findByAgencyId(agencyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bid> getBidsByOwner(Long ownerId) {
        return bidRepository.findByOwnerId(ownerId);
    }

    @Override
    @Transactional
    public boolean deleteBid(Long id) {
        if (bidRepository.existsById(id)) {
            bidRepository.deleteById(id);
            return true;
        }
        return false;
    }
}