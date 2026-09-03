package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.dto.AddressUpdateDto;
import com.example.car_rental_service.model.dto.AgencyUpdateDto;
import com.example.car_rental_service.model.entity.Address;
import com.example.car_rental_service.model.entity.Bid;
import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.enums.AgencyStatus;
import com.example.car_rental_service.model.enums.BidStatus;
import com.example.car_rental_service.model.enums.BookingStatus;
import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.repository.AgencyRepository;
import com.example.car_rental_service.repository.BidRepository;
import com.example.car_rental_service.repository.BookingRepository;
import com.example.car_rental_service.repository.CarRepository;
import com.example.car_rental_service.repository.UserRepository;
import com.example.car_rental_service.service.AgencyService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AgencyServiceImpl implements AgencyService {

    private final AgencyRepository agencyRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final BidRepository bidRepository;
    private final BookingRepository bookingRepository;

    public AgencyServiceImpl(AgencyRepository agencyRepository,
                             UserRepository userRepository,
                             CarRepository carRepository,
                             BidRepository bidRepository,
                             BookingRepository bookingRepository) {
        this.agencyRepository = agencyRepository;
        this.userRepository = userRepository;
        this.carRepository = carRepository;
        this.bidRepository = bidRepository;
        this.bookingRepository = bookingRepository;
    }

    private String getAuthenticatedUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authenticated user found in security context.");
        }
        return auth.getName();
    }

    private Agency getAuthenticatedAgency() {
        String email = getAuthenticatedUserEmail();
        return agencyRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agency profile not found for email: " + email));
    }

    // --- CRUD OPERATIONS ---

    @Override
    public Agency createAgency(Agency agency, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found for email: " + email));

        // Ensure user has AGENCY role
        if (user.getRole() != Role.AGENCY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User role must be AGENCY to create an agency profile.");
        }

        // Prevent duplicate agency profiles for the same user
        if (agencyRepository.findByUserEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An agency profile already exists for this user.");
        }

        agency.setUser(user);
        if (agency.getStatus() == null) {
            agency.setStatus(AgencyStatus.PENDING);
        }

        if (image != null && !image.isEmpty()) {
            agency.setImageType(image.getContentType());
            agency.setProfileImage(image.getBytes());
        }

        return agencyRepository.save(agency);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Agency> getAllAgencies() {
        return agencyRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Agency> getAgencyById(Long id) {
        return agencyRepository.findById(id);
    }

    // Get Agency by UserId
    @Override
    @Transactional(readOnly = true)
    public Optional<Agency> getAgencyByUserId(Long userId) {
        return agencyRepository.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Agency> getAgenciesByStatus(AgencyStatus status) {
        return agencyRepository.findByStatus(status);
    }

    @Override
    public Agency updateAgency(Long id, Agency updatedAgency, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        Agency existingAgency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agency not found with ID: " + id));

        if (existingAgency.getUser() == null || !existingAgency.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own agency profile.");
        }

        existingAgency.setName(updatedAgency.getName());
        existingAgency.setLocation(updatedAgency.getLocation());

        if (updatedAgency.getStatus() != null) {
            existingAgency.setStatus(updatedAgency.getStatus());
        }

        if (updatedAgency.getAddress() != null) {
            existingAgency.setAddress(updatedAgency.getAddress());
        }

        if (image != null && !image.isEmpty()) {
            existingAgency.setImageType(image.getContentType());
            existingAgency.setProfileImage(image.getBytes());
        }

        return agencyRepository.save(existingAgency);
    }

    @Override
    @Transactional(readOnly = true)
    public Agency getMyProfile() {
        return getAuthenticatedAgency();
    }

    @Override
    public Agency updateMyProfile(Agency updatedAgency, MultipartFile image) throws IOException {
        Agency currentAgency = getAuthenticatedAgency();
        return updateAgency(currentAgency.getId(), updatedAgency, image);
    }

    @Override
    public Agency patchAgency(Long id, Agency partialAgency) {
        String email = getAuthenticatedUserEmail();
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agency not found with ID: " + id));

        if (agency.getUser() == null || !agency.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own agency profile.");
        }

        if (partialAgency.getName() != null && !partialAgency.getName().isBlank()) {
            agency.setName(partialAgency.getName());
        }
        if (partialAgency.getLocation() != null && !partialAgency.getLocation().isBlank()) {
            agency.setLocation(partialAgency.getLocation());
        }
        if (partialAgency.getStatus() != null) {
            agency.setStatus(partialAgency.getStatus());
        }
        if (partialAgency.getAddress() != null) {
            agency.setAddress(partialAgency.getAddress());
        }

        return agencyRepository.save(agency);
    }

    @Override
    public Agency updateAgencyImage(Long id, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agency not found with ID: " + id));

        if (agency.getUser() == null || !agency.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own agency profile image.");
        }

        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file cannot be empty.");
        }

        agency.setImageType(image.getContentType());
        agency.setProfileImage(image.getBytes());

        return agencyRepository.save(agency);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getAgencyImage(Long id) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agency not found with ID: " + id));

        if (agency.getProfileImage() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile image found for agency ID: " + id);
        }

        return agency.getProfileImage();
    }

    @Override
    public boolean deleteAgency(Long id) {
        String email = getAuthenticatedUserEmail();
        return agencyRepository.findById(id).map(agency -> {
            if (agency.getUser() == null || !agency.getUser().getEmail().equals(email)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own agency profile.");
            }
            agencyRepository.delete(agency);
            return true;
        }).orElse(false);
    }

    // --- ADMIN OPERATIONS ---

    @Override
    public Optional<Agency> updateAgencyByAdmin(Long id, AgencyUpdateDto updateDto) {
        Optional<Agency> optionalAgency = agencyRepository.findById(id);
        if (optionalAgency.isEmpty()) {
            return Optional.empty();
        }

        Agency agency = optionalAgency.get();

        if (updateDto.getName() != null) {
            agency.setName(updateDto.getName());
        }
        if (updateDto.getLocation() != null) {
            agency.setLocation(updateDto.getLocation());
        }
        if (updateDto.getStatus() != null) {
            agency.setStatus(updateDto.getStatus());
        }
        if (updateDto.getAddress() != null) {
            Address address = agency.getAddress();
            if (address == null) {
                address = new Address();
                agency.setAddress(address);
            }
            applyAddressUpdate(address, updateDto.getAddress());
        }

        return Optional.of(agencyRepository.save(agency));
    }

    @Override
    public boolean deleteAgencyByAdmin(Long id) {
        if (agencyRepository.existsById(id)) {
            agencyRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // --- AGENCY CAR MANAGEMENT ---

    @Override
    @Transactional(readOnly = true)
    public List<Car> getMyAgencyCars() {
        Agency currentAgency = getAuthenticatedAgency();
        return carRepository.findByAgencyId(currentAgency.getId());
    }

    @Override
    public Car updateMyAgencyCarAvailability(Long carId, boolean isAvailable) {
        Agency currentAgency = getAuthenticatedAgency();
        Car car = carRepository.findByIdAndAgencyId(carId, currentAgency.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found or does not belong to your agency."));

        car.setAvailable(isAvailable);
        return carRepository.save(car);
    }

    // --- BID ACCEPTED CARS MANAGEMENT ---

    @Override
    @Transactional(readOnly = true)
    public List<Bid> getAcceptedBids() {
        Agency currentAgency = getAuthenticatedAgency();
        return bidRepository.findByAgencyIdAndStatus(currentAgency.getId(), BidStatus.ACCEPTED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bid> getMyBids() {
        Agency currentAgency = getAuthenticatedAgency();
        return bidRepository.findByAgencyId(currentAgency.getId());
    }

    // --- CUSTOMER BOOKING MANAGEMENT FOR AGENCY CARS ---

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getCustomerBookingsForAgency() {
        Agency currentAgency = getAuthenticatedAgency();
        return bookingRepository.findByCarAgencyId(currentAgency.getId());
    }

    @Override
    public Booking updateBookingStatus(Long bookingId, BookingStatus status) {
        Agency currentAgency = getAuthenticatedAgency();
        Booking booking = bookingRepository.findByIdAndCarAgencyId(bookingId, currentAgency.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or not associated with your agency cars."));

        booking.setStatus(status);

        if (booking.getCar() != null) {
            if (status == BookingStatus.CONFIRMED) {
                booking.getCar().setAvailable(false);
            } else if (status == BookingStatus.CANCELLED || status == BookingStatus.COMPLETED) {
                booking.getCar().setAvailable(true);
            }
        }

        return bookingRepository.save(booking);
    }

    private void applyAddressUpdate(Address address, AddressUpdateDto update) {
        if (update.getDoorNo() != null) address.setDoorNo(update.getDoorNo());
        if (update.getStreet() != null) address.setStreet(update.getStreet());
        if (update.getArea() != null) address.setArea(update.getArea());
        if (update.getCity() != null) address.setCity(update.getCity());
        if (update.getState() != null) address.setState(update.getState());
        if (update.getPincode() != null) address.setPincode(update.getPincode());
        if (update.getLandmark() != null) address.setLandmark(update.getLandmark());
    }
}