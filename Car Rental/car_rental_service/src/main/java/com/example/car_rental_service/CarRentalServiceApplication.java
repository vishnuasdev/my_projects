package com.example.car_rental_service;

import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.model.enums.UserStatus;
import com.example.car_rental_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@SpringBootApplication
public class CarRentalServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarRentalServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDefaultUsers(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                               @Value("${app.seed-default-users:false}") boolean seedDefaultUsers,
                                               @Value("${app.seed-default-password:}") String seedDefaultPassword) {
        return args -> {
            if (!seedDefaultUsers) {
                return;
            }
            if (seedDefaultPassword == null || seedDefaultPassword.length() < 12) {
                throw new IllegalStateException(
                        "SEED_DEFAULT_PASSWORD must be set to at least 12 characters when SEED_DEFAULT_USERS=true.");
            }
            // Demo accounts are opt-in only. Production deployments must provision
            // accounts through the secured admin workflow.
            // 1. ADMIN USER
            String adminEmail = "admin@carrental.com";
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = new User();
                admin.setName("System Admin");
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode(seedDefaultPassword));
                admin.setRole(Role.ADMIN);
                admin.setStatus(UserStatus.ACTIVE);
                userRepository.save(admin);
                System.out.println("Default ADMIN created!");
            } else {
                System.out.println("ADMIN already exists.");
            }

            // 2. AGENCY USER
            String agencyEmail = "agency@carrental.com";
            if (userRepository.findByEmail(agencyEmail).isEmpty()) {
                User agency = new User();
                agency.setName("Default Agency");
                agency.setEmail(agencyEmail);
                agency.setPassword(passwordEncoder.encode(seedDefaultPassword));
                agency.setRole(Role.AGENCY);
                agency.setStatus(UserStatus.ACTIVE);
                userRepository.save(agency);
                System.out.println("Default AGENCY created!");
            } else {
                System.out.println("AGENCY already exists.");
            }

            // 3. OWNER USER
            String ownerEmail = "owner@carrental.com";
            if (userRepository.findByEmail(ownerEmail).isEmpty()) {
                User owner = new User();
                owner.setName("Default Owner");
                owner.setEmail(ownerEmail);
                owner.setPassword(passwordEncoder.encode(seedDefaultPassword));
                owner.setRole(Role.OWNER);
                owner.setStatus(UserStatus.ACTIVE);
                userRepository.save(owner);
                System.out.println("Default OWNER created!");
            } else {
                System.out.println("OWNER already exists.");
            }

            // 4. CUSTOMER USER
            String customerEmail = "customer@carrental.com";
            if (userRepository.findByEmail(customerEmail).isEmpty()) {
                User customer = new User();
                customer.setName("Default Customer");
                customer.setEmail(customerEmail);
                customer.setPassword(passwordEncoder.encode(seedDefaultPassword));
                customer.setRole(Role.CUSTOMER);
                customer.setStatus(UserStatus.ACTIVE);
                userRepository.save(customer);
                System.out.println("Default CUSTOMER created!");
            } else {
                System.out.println("CUSTOMER already exists.");
            }
        };
    }
}