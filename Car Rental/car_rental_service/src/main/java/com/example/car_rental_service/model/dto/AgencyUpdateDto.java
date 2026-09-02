package com.example.car_rental_service.model.dto;

import com.example.car_rental_service.model.enums.AgencyStatus;
import lombok.Data;

@Data
public class AgencyUpdateDto {
    private String name;
    private String location;
    private AgencyStatus status;
    private AddressUpdateDto address;
}