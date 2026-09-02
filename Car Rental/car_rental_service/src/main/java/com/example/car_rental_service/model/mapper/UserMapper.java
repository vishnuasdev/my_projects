package com.example.car_rental_service.model.mapper;

import com.example.car_rental_service.model.dto.request.UserRegistrationRequest;
import com.example.car_rental_service.model.dto.response.UserResponse;
import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.model.enums.UserStatus;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserRegistrationRequest dto) {
        if (dto == null) return null;

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());

        if (dto.getRole() != null) {
            user.setRole(Role.valueOf(dto.getRole().toUpperCase()));
        }
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }

    public UserResponse toResponseDto(User user) {
        if (user == null) return null;

        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        dto.setStatus(user.getStatus() != null ? user.getStatus().name() : null);
        return dto;
    }
}