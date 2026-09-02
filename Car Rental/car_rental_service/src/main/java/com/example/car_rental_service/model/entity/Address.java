package com.example.car_rental_service.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 30)
    private String doorNo;
    @NotBlank @Size(max = 150)
    private String street;
    @Size(max = 150)
    private String area;
    @NotBlank @Size(max = 100)
    private String city;
    @NotBlank @Size(max = 100)
    private String state;
    @Pattern(regexp = "^[0-9]{4,10}$", message = "Pincode must contain 4 to 10 digits")
    private String pincode;
    @Size(max = 150)
    private String landmark;
}
