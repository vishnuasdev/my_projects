package com.example.car_rental_service.model.entity;

import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.entity.users.Customer;
import com.example.car_rental_service.model.enums.BookingStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @DecimalMin(value = "0.01")
    private Double ratePerDay;

    @DecimalMin(value = "1.0")
    private Double noOfDays;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.PENDING;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @ManyToOne
    @JoinColumn(name = "agency_id")
    private Agency agency;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    @NotNull
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "car_id", nullable = false)
    @NotNull
    private Car car;

    @Transient
    public Double getTotalCost() {
        if (ratePerDay != null && noOfDays != null) {
            return ratePerDay * noOfDays;
        }
        return 0.0;
    }
}