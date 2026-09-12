package com.example.car_rental_service.model.dto;

import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.model.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminUserUpdateDto(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 30) String phoneNumber,
        Role role,
        UserStatus status
) {
}
