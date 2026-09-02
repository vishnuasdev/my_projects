package com.example.car_rental_service.model.entity.users;

import com.example.car_rental_service.model.entity.Address;
import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.enums.AgencyStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "agencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Agency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 150)
    private String name;
    @NotBlank @Size(max = 150)
    private String location;

    @Enumerated(EnumType.STRING)
    private AgencyStatus status = AgencyStatus.PENDING;

    private String imageType;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] profileImage;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @JsonIgnore
    private User user;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "address_id", referencedColumnName = "id")
    @Valid
    @JsonIgnore
    private Address address;
}
