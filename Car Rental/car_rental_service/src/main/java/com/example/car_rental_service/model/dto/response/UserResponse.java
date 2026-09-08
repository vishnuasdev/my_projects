package com.example.car_rental_service.model.dto.response;

import com.example.car_rental_service.model.entity.Address;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private String dob;
    private String location;
    private Address address;
}