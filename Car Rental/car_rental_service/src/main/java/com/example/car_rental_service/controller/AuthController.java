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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService,
                          UserMapper userMapper,
                          AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody UserRegistrationRequest requestDto) {
        User user = userMapper.toEntity(requestDto);
        User savedUser = userService.registerUser(user);

        // Correct HTTP status code for resource creation
        return ResponseEntity.status(HttpStatus.CREATED).body(userMapper.toResponseDto(savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        // 1. Fetch user entity first to verify account status
        User user = userService.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));

        // 2. Validate account status before authenticating credentials
        if (user.getStatus() != UserStatus.ACTIVE) {
            String message = (user.getStatus() == UserStatus.BLOCKED)
                    ? "Your account has been blocked. Please contact system support."
                    : "Your account is temporarily suspended. Access is denied.";

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "status", user.getStatus().name(),
                    "message", message
            ));
        }

        // 3. Authenticate user credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 4. Set authentication context
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 5. Extract role cleanly from GrantedAuthorities
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse(user.getRole().name());

        // 6. Generate token
        String jwt = jwtUtil.generateToken(userDetails, role);

        return ResponseEntity.ok(new JwtResponse(jwt, user.getEmail(), role, user.getStatus().name()));
    }
}