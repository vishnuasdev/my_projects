package com.example.car_rental_service.service;

import com.example.car_rental_service.model.entity.users.Customer;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface CustomerService {

    // --- CRUD OPERATIONS ---
    Customer createCustomer(Customer customer, MultipartFile image) throws IOException;

    List<Customer> getAllCustomers();

    Optional<Customer> getCustomerById(Long id);

    Customer getCustomerByUserId(Long userId);

    Customer updateCustomer(Long id, Customer updatedCustomer, MultipartFile image) throws IOException;

    Customer patchCustomer(Long id, Customer partialCustomer);

    Customer updateCustomerImage(Long id, MultipartFile image) throws IOException;

    byte[] getCustomerImage(Long id);

    void removeCustomerImage(Long id);

    boolean deleteCustomer(Long id);

    // --- ADMIN OPERATIONS ---
    Optional<Customer> updateCustomerByAdmin(Long id, Customer updateData);

    boolean deleteCustomerByAdmin(Long id);
}