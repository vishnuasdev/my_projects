package com.example.car_rental_service.model.entity.users;

import com.example.car_rental_service.model.entity.Address;
import com.example.car_rental_service.model.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "owners")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Owner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    

    private String dob;

    @Size(max = 150)
    private String location;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] profileImage;

    private String imageType;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @JsonIgnore
    private User user;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "address_id", referencedColumnName = "id")
    @Valid
    @JsonIgnore
    private Address address;

    @Transient
    private String name;

    @Transient
    private String phoneNumber;

    @JsonProperty("name")
    public String getName() {
        if (user != null && user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @JsonProperty("email")
    public String getEmail() {
        return user != null ? user.getEmail() : null;
    }

    @JsonProperty("phone")
    public String getPhoneNumber() {
        if (user != null && user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
            return user.getPhoneNumber();
        }
        return this.phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
