package com.example.car_rental_service.model.dto;

import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.model.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminUserCreateDto(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 30) String phoneNumber,
        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Password must contain letters and numbers")
        String password,
        @jakarta.validation.constraints.NotNull Role role,
        UserStatus status
) {
}
