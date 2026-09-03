package com.example.car_rental_service.service;

import com.example.car_rental_service.model.dto.AgencyUpdateDto;
import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.enums.AgencyStatus;
import com.example.car_rental_service.model.enums.BookingStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface AgencyService {

    // --- CRUD OPERATIONS ---
    Agency createAgency(Agency agency, MultipartFile image) throws IOException;

    Optional<Agency> getAgencyById(Long id);

    Optional<Agency> getAgencyByUserId(Long userId);

    List<Agency> getAgenciesByStatus(AgencyStatus status);

    Agency updateAgency(Long id, Agency updatedAgency, MultipartFile image) throws IOException;

    Agency getMyProfile();

    Agency updateMyProfile(Agency updatedAgency, MultipartFile image) throws IOException;

    Agency patchAgency(Long id, Agency partialAgency);

    Agency updateAgencyImage(Long id, MultipartFile image) throws IOException;

    byte[] getAgencyImage(Long id);

    boolean deleteAgency(Long id);

    // --- ADMIN OPERATIONS ---
    Optional<Agency> updateAgencyByAdmin(Long id, AgencyUpdateDto updateDto);

    boolean deleteAgencyByAdmin(Long id);

    List<Agency> getAllAgencies();

    // --- AGENCY CAR & BOOKING MANAGEMENT ---
    List<Car> getMyAgencyCars();

    Car updateMyAgencyCarAvailability(Long carId, boolean isAvailable);

    List<Bid> getAcceptedBids();

    List<Bid> getMyBids();

    List<Booking> getCustomerBookingsForAgency();

    Booking updateBookingStatus(Long bookingId, BookingStatus status);
}