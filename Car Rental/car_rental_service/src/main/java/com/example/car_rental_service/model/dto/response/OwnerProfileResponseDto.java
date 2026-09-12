package com.example.car_rental_service.model.dto.response;

import com.example.car_rental_service.model.entity.Address;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OwnerProfileResponseDto {
    private Long id;
    private String dob;
    private String location;
    private String imageType;
    private Address address;
    private String userEmail;
}