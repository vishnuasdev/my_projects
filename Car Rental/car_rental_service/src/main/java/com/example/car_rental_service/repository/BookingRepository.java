package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerId(Long customerId);

    @Query("SELECT b FROM Booking b WHERE b.customer.id = :customerId AND b.customer.user.email = :email")
    List<Booking> findByCustomerIdAndCustomerUserEmail(@Param("customerId") Long customerId,
                                                        @Param("email") String email);

    @Query("SELECT b FROM Booking b WHERE b.customer.user.email = :email")
    List<Booking> findByCustomerUserEmail(@Param("email") String email);

    List<Booking> findByCarId(Long carId);

    @Query("SELECT b FROM Booking b WHERE b.car.id = :carId AND b.car.owner.user.email = :email")
    List<Booking> findByCarIdAndCarOwnerUserEmail(@Param("carId") Long carId, @Param("email") String email);

    @Query("SELECT b FROM Booking b WHERE b.car.agency.id = :agencyId")
    List<Booking> findByAgencyId(@Param("agencyId") Long agencyId);

    List<Booking> findByCarAgencyId(Long agencyId);

    @Query("SELECT b FROM Booking b WHERE b.car.agency.id = :agencyId AND b.car.agency.user.email = :email")
    List<Booking> findByCarAgencyIdAndAgencyUserEmail(@Param("agencyId") Long agencyId,
                                                       @Param("email") String email);

    Optional<Booking> findByIdAndCarAgencyId(Long id, Long agencyId);

    @Query("SELECT b FROM Booking b WHERE b.id = :id AND b.customer.user.email = :email")
    Optional<Booking> findByIdAndCustomerUserEmail(@Param("id") Long id, @Param("email") String email);

    @Query("SELECT b FROM Booking b WHERE b.id = :id AND b.car.agency.user.email = :email")
    Optional<Booking> findByIdAndAgencyUserEmail(@Param("id") Long id, @Param("email") String email);

    @Query("SELECT b FROM Booking b WHERE b.car.owner.user.email = :email")
    List<Booking> findByCarOwnerUserEmail(@Param("email") String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id AND b.car.agency.id = :agencyId")
    Optional<Booking> findByIdAndCarAgencyIdForUpdate(
            @Param("id") Long id,
            @Param("agencyId") Long agencyId);

    List<Booking> findByStatus(BookingStatus status);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b 
        WHERE b.car.id = :carId 
          AND (:excludeBookingId IS NULL OR b.id <> :excludeBookingId)
          AND b.status NOT IN :excludedStatuses 
          AND (:startDate <= b.endDate AND :endDate >= b.startDate)
    """)
    boolean existsOverlappingBooking(
            @Param("carId") Long carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludedStatuses") List<BookingStatus> excludedStatuses,
            @Param("excludeBookingId") Long excludeBookingId
    );

    default boolean existsOverlappingBooking(Long carId, LocalDate startDate, LocalDate endDate) {
        return existsOverlappingBooking(
                carId,
                startDate,
                endDate,
                List.of(BookingStatus.CANCELLED, BookingStatus.REJECTED, BookingStatus.COMPLETED),
                null
        );
    }
}