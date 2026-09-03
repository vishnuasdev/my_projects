package com.example.car_rental_service.controller;

import com.example.car_rental_service.model.dto.request.LoginRequest;
import com.example.car_rental_service.model.dto.request.UserRegistrationRequest;
import com.example.car_rental_service.model.dto.response.JwtResponse;
import com.example.car_rental_service.model.dto.response.UserResponse;
import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.enums.UserStatus;
import com.example.car_rental_service.model.mapper.UserMapper;
import com.example.car_rental_service.security.JwtUtil;
import com.example.car_rental_service.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, UserMapper userMapper,
                          AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody UserRegistrationRequest requestDto) {
        User user = userMapper.toEntity(requestDto);
        User savedUser = userService.registerUser(user);
        return ResponseEntity.ok(userMapper.toResponseDto(savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        // 1. Authenticate user credentials first
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Fetch user entity from database
        User user = userService.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // 3. Block access if status is BLOCKED or SUSPENDED
        if (user.getStatus() != UserStatus.ACTIVE) {
            String message = user.getStatus() == UserStatus.BLOCKED
                    ? "Your account has been blocked. Please contact system support."
                    : "Your account is temporarily suspended. Access is denied.";

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "status", user.getStatus().name(),
                    "message", message
            ));
        }

        // 4. Set authentication context & generate token for ACTIVE users
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        assert userDetails != null;
        String jwt = jwtUtil.generateToken(userDetails, user.getRole().name());

        return ResponseEntity.ok(new JwtResponse(jwt, user.getEmail(), user.getRole().name(), user.getStatus().name()));
    }
}