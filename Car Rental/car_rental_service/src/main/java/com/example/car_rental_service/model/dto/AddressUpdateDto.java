package com.example.car_rental_service.model.dto;

import lombok.Data;

@Data
public class AddressUpdateDto {
    private String doorNo;
    private String street;
    private String area;
    private String city;
    private String state;
    private String pincode;
    private String landmark;
}