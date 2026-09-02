package com.example.car_rental_service.model.entity;

import com.example.car_rental_service.model.entity.users.Agency;
import com.example.car_rental_service.model.entity.users.Owner;
import com.example.car_rental_service.model.enums.BidStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cars")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 80)
    private String brand;

    @NotBlank @Size(max = 80)
    private String model;

    @NotBlank @Size(max = 50)
    @Column(unique = true)
    private String registrationNo;

    @NotBlank
    private String fuelType;

    @NotBlank
    private String transmission;

    @NotNull @DecimalMin(value = "0.01")
    private Double dailyRate;

    @Size(max = 2000)
    private String description;

    @JsonProperty("isAvailable")
    private boolean isAvailable = true;

    @Enumerated(EnumType.STRING)
    private BidStatus bidStatus = BidStatus.PENDING;

    @Size(max = 500)
    private String agencyRemarks;

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CarImage> images = new ArrayList<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private Owner owner;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agency_id")
    private Agency agency;

    @Transient
    public int getImageCount() {
        return images != null ? images.size() : 0;
    }

    public void addImage(CarImage image) {
        if (this.images.size() >= 5) {
            throw new IllegalArgumentException("Maximum limit of 5 images per vehicle reached.");
        }
        images.add(image);
        image.setCar(this);
    }

    public void removeImage(CarImage image) {
        images.remove(image);
        image.setCar(null);
    }
}