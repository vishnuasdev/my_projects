package com.example.car_rental_service.model.entity;

import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.entity.users.Owner;
import com.example.car_rental_service.model.enums.BidStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bids")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull @DecimalMin(value = "0.01")
    private Double ratePerDay;

    @Enumerated(EnumType.STRING)
    private BidStatus status = BidStatus.PENDING;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    @NotNull
    private Owner owner; // The owner proposing the car and rate

    @ManyToOne
    @JoinColumn(name = "agency_id", nullable = false)
    @NotNull
    private Agency agency; // The agency receiving the bid

    @ManyToOne
    @JoinColumn(name = "car_id", nullable = false)
    @NotNull
    private Car car; // The car being bid / listed under the agency

    @Transient
    @JsonProperty("carId")
    public Long getCarId() {
        return car != null ? car.getId() : null;
    }

    @Transient
    @JsonProperty("bidderEmail")
    public String getBidderEmail() {
        return owner != null && owner.getUser() != null ? owner.getUser().getEmail() : null;
    }

    @Transient
    @JsonProperty("amount")
    public Double getAmount() {
        return ratePerDay;
    }
}
