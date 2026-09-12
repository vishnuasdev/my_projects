package com.example.car_rental_service.service;

import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.dto.AdminPasswordUpdateDto;
import com.example.car_rental_service.model.dto.AdminUserUpdateDto;
import com.example.car_rental_service.model.dto.UserPasswordChangeDto;
import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.model.enums.UserStatus;

import java.util.List;
import java.util.Optional;

public interface UserService {

    // CREATE / REGISTER
    User registerUser(User user);

    // READ
    List<User> getAllUsers();

    User getUserById(Long id);

    User getUserByEmail(String email);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> getUsersByRole(Role role);

    List<User> getUsersByStatus(UserStatus status);

    // UPDATE
    User updateUser(Long id, User updatedUser);
    User updateUserProfile(Long id, AdminUserUpdateDto update);
    void updateUserPassword(Long id, AdminPasswordUpdateDto update);
    void changeOwnPassword(String email, UserPasswordChangeDto update);

    User updateUserStatus(Long id, UserStatus newStatus);

    // DELETE
    void deleteUser(Long id);
    void deleteUser(Long id, String performingAdminEmail);

}