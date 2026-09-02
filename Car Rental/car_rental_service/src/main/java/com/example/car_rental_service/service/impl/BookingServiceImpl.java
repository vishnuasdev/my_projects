package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.entity.users.Customer;
import com.example.car_rental_service.model.enums.BookingStatus;
import com.example.car_rental_service.repository.AgencyRepository;
import com.example.car_rental_service.repository.BookingRepository;
import com.example.car_rental_service.repository.CarRepository;
import com.example.car_rental_service.repository.CustomerRepository;
import com.example.car_rental_service.service.BookingService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final AgencyRepository agencyRepository;
    private final CarRepository carRepository;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              CustomerRepository customerRepository,
                              AgencyRepository agencyRepository,
                              CarRepository carRepository) {
        this.bookingRepository = bookingRepository;
        this.customerRepository = customerRepository;
        this.agencyRepository = agencyRepository;
        this.carRepository = carRepository;
    }

    private String getAuthenticatedUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found.");
        }
        return auth.getName();
    }

    private void validateBookingDates(Booking booking) {
        if (booking.getStartDate() == null || booking.getEndDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required.");
        }
        if (booking.getStartDate().isAfter(booking.getEndDate())) {
            throw new IllegalArgumentException("Start date must be before or equal to the end date.");
        }
    }

    @Override
    @Transactional
    public Booking createBooking(Booking booking) {
        validateBookingDates(booking);

        if (bookingRepository.existsOverlappingBooking(booking.getCar().getId(), booking.getStartDate(), booking.getEndDate())) {
            throw new IllegalStateException("Car is already reserved for the selected date range.");
        }

        long days = ChronoUnit.DAYS.between(booking.getStartDate(), booking.getEndDate()) + 1;
        booking.setNoOfDays((double) days);

        if (booking.getRatePerDay() == null && booking.getCar() != null) {
            booking.setRatePerDay(booking.getCar().getDailyRate());
        }

        if (booking.getStatus() == null) {
            booking.setStatus(BookingStatus.CONFIRMED);
        }

        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public Booking createBooking(Booking booking, String userEmail) {
        Customer customer = customerRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer profile not found for email: " + userEmail));
        booking.setCustomer(customer);
        return createBooking(booking);
    }

    @Override
    @Transactional
    public Booking createBookingRequest(Long carId, Booking requestDetails) {
        validateBookingDates(requestDetails);

        String email = getAuthenticatedUserEmail();
        Customer customer = customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer profile not found for email: " + email));

        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new RuntimeException("Car not found with ID: " + carId));

        if (!car.isAvailable()) {
            throw new IllegalStateException("Car is currently unavailable.");
        }

        boolean isOverlapping = bookingRepository.existsOverlappingBooking(
                carId, requestDetails.getStartDate(), requestDetails.getEndDate()
        );
        if (isOverlapping) {
            throw new IllegalStateException("Car is already reserved or pending approval for the selected dates.");
        }

        long days = ChronoUnit.DAYS.between(requestDetails.getStartDate(), requestDetails.getEndDate()) + 1;

        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setCar(car);
        booking.setAgency(car.getAgency());
        booking.setStartDate(requestDetails.getStartDate());
        booking.setEndDate(requestDetails.getEndDate());
        booking.setRatePerDay(car.getDailyRate());
        booking.setNoOfDays((double) days);
        booking.setStatus(BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getBookingsByCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUserEmail(String email) {
        return bookingRepository.findByCustomerUserEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getBookingsByCar(Long carId) {
        return bookingRepository.findByCarId(carId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getBookingsByAgency(Long agencyId) {
        return bookingRepository.findByAgencyId(agencyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getMyBookings() {
        String email = getAuthenticatedUserEmail();
        Customer customer = customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer profile not found."));
        return bookingRepository.findByCustomerId(customer.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getBookingsForAgencyCars() {
        String email = getAuthenticatedUserEmail();
        Agency agency = agencyRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Agency profile not found."));
        return bookingRepository.findByCarAgencyId(agency.getId());
    }

    @Override
    @Transactional
    public Booking updateBookingStatus(Long bookingId, BookingStatus status) {
        String email = getAuthenticatedUserEmail();
        Agency agency = agencyRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Agency profile not found."));

        Booking booking = bookingRepository.findByIdAndCarAgencyId(bookingId, agency.getId())
                .orElseThrow(() -> new RuntimeException("Booking not found or not associated with your agency."));

        if (status == BookingStatus.CONFIRMED) {
            boolean existsConflict = bookingRepository.existsOverlappingBooking(
                    booking.getCar().getId(),
                    booking.getStartDate(),
                    booking.getEndDate(),
                    List.of(BookingStatus.CANCELLED),
                    booking.getId()
            );

            if (existsConflict) {
                throw new IllegalStateException("Cannot confirm: dates collide with an already reserved booking.");
            }
            if (booking.getCar() != null) {
                booking.getCar().setAvailable(false);
            }
        } else if (status == BookingStatus.CANCELLED || status == BookingStatus.COMPLETED) {
            if (booking.getCar() != null) {
                booking.getCar().setAvailable(true);
            }
        }

        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public boolean cancelBooking(Long id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus(BookingStatus.CANCELLED);
            if (booking.getCar() != null) {
                booking.getCar().setAvailable(true);
            }
            bookingRepository.save(booking);
            return true;
        }).orElse(false);
    }

    @Override
    @Transactional
    public boolean cancelBooking(Long id, String userEmail) {
        return bookingRepository.findById(id)
                .filter(b -> b.getCustomer() != null && b.getCustomer().getUser() != null
                        && b.getCustomer().getUser().getEmail().equals(userEmail))
                .map(booking -> {
                    booking.setStatus(BookingStatus.CANCELLED);
                    if (booking.getCar() != null) {
                        booking.getCar().setAvailable(true);
                    }
                    bookingRepository.save(booking);
                    return true;
                }).orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
}