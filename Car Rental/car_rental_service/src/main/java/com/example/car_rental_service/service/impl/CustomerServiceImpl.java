package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.entity.Address;
import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.entity.users.Customer;
import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.repository.CustomerRepository;
import com.example.car_rental_service.repository.UserRepository;
import com.example.car_rental_service.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public CustomerServiceImpl(CustomerRepository customerRepository, UserRepository userRepository) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    private String getAuthenticatedUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authenticated user found in security context.");
        }
        return auth.getName();
    }

    // --- CRUD OPERATIONS ---

    @Override
    public Customer createCustomer(Customer customer, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found for email: " + email));

        if (user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User role must be CUSTOMER to create a customer profile.");
        }

        if (customerRepository.findByUserEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A customer profile already exists for this user.");
        }

        customer.setUser(user);

        if (image != null && !image.isEmpty()) {
            customer.setImageType(image.getContentType());
            customer.setProfileImage(image.getBytes());
        }

        return customerRepository.save(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Customer getCustomerByUserId(Long userId) {
        return customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer profile not found for User ID: " + userId));
    }

    @Override
    public Customer updateCustomer(Long id, Customer updatedCustomer, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        Customer existingCustomer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found with ID: " + id));

        if (existingCustomer.getUser() == null || !existingCustomer.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own customer profile.");
        }

        if (updatedCustomer.getProfileName() != null && !updatedCustomer.getProfileName().isBlank()) {
            existingCustomer.getUser().setName(updatedCustomer.getProfileName().trim());
        }
        if (updatedCustomer.getProfilePhone() != null) {
            existingCustomer.getUser().setPhoneNumber(updatedCustomer.getProfilePhone().trim());
        }
        existingCustomer.setDob(updatedCustomer.getDob());
        existingCustomer.setLicenseNo(updatedCustomer.getLicenseNo());
        existingCustomer.setLocation(updatedCustomer.getLocation());

        if (updatedCustomer.getAddress() != null) {
            existingCustomer.setAddress(updatedCustomer.getAddress());
        }

        if (image != null && !image.isEmpty()) {
            existingCustomer.setImageType(image.getContentType());
            existingCustomer.setProfileImage(image.getBytes());
        }

        existingCustomer.setProfileName(existingCustomer.getUser().getName());
        existingCustomer.setProfilePhone(existingCustomer.getUser().getPhoneNumber());
        return customerRepository.save(existingCustomer);
    }

    @Override
    public Customer patchCustomer(Long id, Customer partialCustomer) {
        String email = getAuthenticatedUserEmail();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found with ID: " + id));

        if (customer.getUser() == null || !customer.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own customer profile.");
        }

        if (partialCustomer.getProfileName() != null && !partialCustomer.getProfileName().isBlank()) {
            customer.getUser().setName(partialCustomer.getProfileName().trim());
        }
        if (partialCustomer.getProfilePhone() != null) {
            customer.getUser().setPhoneNumber(partialCustomer.getProfilePhone().trim());
        }
        if (partialCustomer.getDob() != null && !partialCustomer.getDob().isBlank()) {
            customer.setDob(partialCustomer.getDob());
        }
        if (partialCustomer.getLicenseNo() != null && !partialCustomer.getLicenseNo().isBlank()) {
            customer.setLicenseNo(partialCustomer.getLicenseNo());
        }
        if (partialCustomer.getLocation() != null && !partialCustomer.getLocation().isBlank()) {
            customer.setLocation(partialCustomer.getLocation());
        }
        if (partialCustomer.getAddress() != null) {
            customer.setAddress(partialCustomer.getAddress());
        }

        customer.setProfileName(customer.getUser().getName());
        customer.setProfilePhone(customer.getUser().getPhoneNumber());
        return customerRepository.save(customer);
    }

    @Override
    public Customer updateCustomerImage(Long id, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found with ID: " + id));

        if (customer.getUser() == null || !customer.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own customer profile image.");
        }

        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file cannot be empty.");
        }

        customer.setImageType(image.getContentType());
        customer.setProfileImage(image.getBytes());

        return customerRepository.save(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getCustomerImage(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found with ID: " + id));

        if (customer.getProfileImage() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile image found for customer ID: " + id);
        }

        return customer.getProfileImage();
    }

    @Override
    public void removeCustomerImage(Long id) {
        String email = getAuthenticatedUserEmail();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found with ID: " + id));

        if (customer.getUser() == null || !customer.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own customer profile image.");
        }

        customer.setProfileImage(null);
        customer.setImageType(null);
        customerRepository.save(customer);
    }

    @Override
    public boolean deleteCustomer(Long id) {
        String email = getAuthenticatedUserEmail();
        return customerRepository.findById(id).map(customer -> {
            if (customer.getUser() == null || !customer.getUser().getEmail().equals(email)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own customer profile.");
            }
            customerRepository.delete(customer);
            return true;
        }).orElse(false);
    }

    // --- ADMIN OPERATIONS ---

    @Override
    public Optional<Customer> updateCustomerByAdmin(Long id, Customer updateData) {
        Optional<Customer> optionalCustomer = customerRepository.findById(id);
        if (optionalCustomer.isEmpty()) {
            return Optional.empty();
        }

        Customer customer = optionalCustomer.get();

        if (updateData.getDob() != null) {
            customer.setDob(updateData.getDob());
        }
        if (updateData.getLicenseNo() != null) {
            customer.setLicenseNo(updateData.getLicenseNo());
        }
        if (updateData.getLocation() != null) {
            customer.setLocation(updateData.getLocation());
        }
        if (updateData.getAddress() != null) {
            Address address = customer.getAddress();
            if (address == null) {
                address = new Address();
                customer.setAddress(address);
            }
            applyAddressUpdate(address, updateData.getAddress());
        }

        return Optional.of(customerRepository.save(customer));
    }

    @Override
    public boolean deleteCustomerByAdmin(Long id) {
        if (customerRepository.existsById(id)) {
            customerRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private void applyAddressUpdate(Address target, Address source) {
        if (source.getDoorNo() != null) target.setDoorNo(source.getDoorNo());
        if (source.getStreet() != null) target.setStreet(source.getStreet());
        if (source.getArea() != null) target.setArea(source.getArea());
        if (source.getCity() != null) target.setCity(source.getCity());
        if (source.getState() != null) target.setState(source.getState());
        if (source.getPincode() != null) target.setPincode(source.getPincode());
        if (source.getLandmark() != null) target.setLandmark(source.getLandmark());
    }
}