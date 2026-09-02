package com.example.car_rental_service.model.dto.request;

import com.example.car_rental_service.model.enums.AgencyStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AgencyStatusRequest {

    @NotBlank(message = "Name cannot be blank")
    private String agencyName;

    @NotBlank(message = "Agency status cannot be blank")
    private AgencyStatus status;
}