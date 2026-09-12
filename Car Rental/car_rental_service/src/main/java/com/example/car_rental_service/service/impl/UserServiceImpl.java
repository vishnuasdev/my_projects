package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.dto.AdminPasswordUpdateDto;
import com.example.car_rental_service.model.dto.AdminUserUpdateDto;
import com.example.car_rental_service.model.dto.UserPasswordChangeDto;
import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.model.enums.UserStatus;
import com.example.car_rental_service.repository.UserRepository;
import com.example.car_rental_service.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User registerUser(User user) {
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email cannot be null or empty.");
        }
        if (user.getPassword() == null
                || user.getPassword().length() < 8
                || user.getPassword().length() > 72
                || !user.getPassword().matches("^(?=.*[A-Za-z])(?=.*\\d).+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be 8-72 characters and contain letters and numbers.");
        }

        String normalizedEmail = user.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An account with this email already exists: " + normalizedEmail);
        }

        String normalizedPhone = normalizePhone(user.getPhoneNumber());
        if (normalizedPhone != null && userRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this mobile number already exists.");
        }

        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration as ADMIN is not allowed through public signup.");
        }

        if (user.getStatus() == null) {
            user.setStatus(UserStatus.ACTIVE);
        }

        user.setEmail(normalizedEmail);
        user.setPhoneNumber(normalizedPhone);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email parameter cannot be null or empty.");
        }
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email.trim().toLowerCase());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return userRepository.existsByEmail(email.trim().toLowerCase());
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsersByStatus(UserStatus status) {
        return userRepository.findByStatus(status);
    }

    @Override
    public User updateUser(Long id, User updatedUser) {
        User existingUser = getUserById(id);
        
        if (updatedUser.getName() != null) {
            existingUser.setName(updatedUser.getName());
        }
        if (updatedUser.getPhoneNumber() != null) {
            String phone = normalizePhone(updatedUser.getPhoneNumber());
            if (phone != null && userRepository.existsByPhoneNumberAndIdNot(phone, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this mobile number already exists.");
            }
            existingUser.setPhoneNumber(phone);
        }
        if (updatedUser.getRole() != null) {
            existingUser.setRole(updatedUser.getRole());
        }
        if (updatedUser.getStatus() != null) {
            existingUser.setStatus(updatedUser.getStatus());
        }
        if (updatedUser.getPassword() != null && updatedUser.getPassword().length() >= 6) {
            existingUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }

        return userRepository.save(existingUser);
    }

    @Override
    public User updateUserProfile(Long id, AdminUserUpdateDto update) {
        User existingUser = getUserById(id);
        String email = update.email().trim().toLowerCase();
        userRepository.findByEmail(email)
                .filter(user -> !user.getId().equals(id))
                .ifPresent(user -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
                });

        existingUser.setName(update.name().trim());
        existingUser.setEmail(email);
        String phone = normalizePhone(update.phoneNumber());
        if (phone != null && userRepository.existsByPhoneNumberAndIdNot(phone, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this mobile number already exists.");
        }
        existingUser.setPhoneNumber(phone);
        if (update.role() != null) {
            existingUser.setRole(update.role());
        }
        if (update.status() != null) {
            existingUser.setStatus(update.status());
        }
        return userRepository.save(existingUser);
    }

    @Override
    public void updateUserPassword(Long id, AdminPasswordUpdateDto update) {
        User existingUser = getUserById(id);
        existingUser.setPassword(passwordEncoder.encode(update.password()));
        userRepository.save(existingUser);
    }

    @Override
    public void changeOwnPassword(String email, UserPasswordChangeDto update) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found."));
        if (!passwordEncoder.matches(update.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        if (passwordEncoder.matches(update.newPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from the current password.");
        }
        user.setPassword(passwordEncoder.encode(update.newPassword()));
        userRepository.save(user);
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String normalized = phone.trim();
        if (!normalized.matches("^\\+?[0-9][0-9\\s-]{6,29}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mobile number format is invalid.");
        }
        return normalized;
    }

    @Override
    public User updateUserStatus(Long id, UserStatus newStatus) {
        User existingUser = getUserById(id);
        existingUser.setStatus(newStatus);
        return userRepository.save(existingUser);
    }

    @Override
    public void deleteUser(Long id) {
        User existingUser = getUserById(id);

        if (existingUser.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrator accounts cannot be deleted directly.");
        }

        userRepository.delete(existingUser);
    }

    @Override
    public void deleteUser(Long id, String performingAdminEmail) {
        User existingUser = getUserById(id);

        if (existingUser.getEmail().equalsIgnoreCase(performingAdminEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own administrative account.");
        }

        if (existingUser.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrator accounts cannot be deleted directly.");
        }

        userRepository.delete(existingUser);
    }
}