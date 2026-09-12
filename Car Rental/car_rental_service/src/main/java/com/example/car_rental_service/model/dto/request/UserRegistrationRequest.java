package com.example.car_rental_service.model.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UserRegistrationRequest {

    @NotBlank(message = "Name cannot be blank")
    private String name;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email cannot be blank")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$", message = "Password must be 8-72 characters and include both letters and numbers")
    private String password;

    @Pattern(regexp = "^\\+?[0-9][0-9\\s-]{6,28}$", message = "Invalid mobile number")
    private String phoneNumber;

    @Pattern(regexp = "^(CUSTOMER|OWNER|AGENCY)$", message = "Role must be CUSTOMER, OWNER, or AGENCY")
    private String role = "CUSTOMER";
}
