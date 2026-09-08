package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.enums.AgencyStatus;
import com.example.car_rental_service.model.enums.BidStatus;
import com.example.car_rental_service.repository.AgencyRepository;
import com.example.car_rental_service.repository.BidRepository;
import com.example.car_rental_service.repository.CarRepository;
import com.example.car_rental_service.repository.OwnerRepository;
import com.example.car_rental_service.service.BidService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BidServiceImpl implements BidService {

    private final BidRepository bidRepository;
    private final CarRepository carRepository;
    private final OwnerRepository ownerRepository;
    private final AgencyRepository agencyRepository;

    public BidServiceImpl(BidRepository bidRepository, CarRepository carRepository,
                          OwnerRepository ownerRepository,
                          AgencyRepository agencyRepository) {
        this.bidRepository = bidRepository;
        this.carRepository = carRepository;
        this.ownerRepository = ownerRepository;
        this.agencyRepository = agencyRepository;
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
        boolean approvedAgency = bid.getAgency() != null && bid.getAgency().getId() != null
                && agencyRepository.findById(bid.getAgency().getId())
                .map(agency -> agency.getStatus() == AgencyStatus.APPROVED)
                .orElse(false);
        if (!approvedAgency) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Only approved agencies can receive bids.");
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
                bid.getCar().setAgency(bid.getAgency());
                bid.getCar().setDailyRate(bid.getRatePerDay());
                bid.getCar().setBidStatus(BidStatus.ACCEPTED);
                bid.getCar().setAvailable(true);
                carRepository.saveAndFlush(bid.getCar());
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
    @Transactional(readOnly = true)
    public List<Bid> getBidsByOwnerEmail(String email) {
        return ownerRepository.findByUserEmail(email)
                .map(owner -> bidRepository.findByOwnerId(owner.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Owner profile not found for account: " + email));
    }

    @Override
    @Transactional
    public boolean deleteBidByOwner(Long id, String email) {
        return ownerRepository.findByUserEmail(email)
                .flatMap(owner -> bidRepository.findById(id)
                        .filter(bid -> bid.getOwner() != null && owner.getId().equals(bid.getOwner().getId())))
                .map(bid -> {
                    bidRepository.delete(bid);
                    return true;
                })
                .orElse(false);
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