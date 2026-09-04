package com.example.car_rental_service.controller.users;

import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.entity.users.Customer;
import com.example.car_rental_service.service.BookingService;
import com.example.car_rental_service.service.CustomerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final BookingService bookingService;

    @Autowired
    public CustomerController(CustomerService customerService, BookingService bookingService) {
        this.customerService = customerService;
        this.bookingService = bookingService;
    }

    // --- STANDARD USER OPERATIONS ---

    // POST: Create customer with optional profile image (Multipart Form Data)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Customer> createCustomer(
            @RequestPart("customer") @Valid Customer customer,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        Customer created = customerService.createCustomer(customer, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // POST: Create customer with JSON payload only
    @PostMapping(path = "/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Customer> createCustomerJsonOnly(@Valid @RequestBody Customer customer) throws IOException {
        Customer created = customerService.createCustomer(customer, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // GET: List all customers
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    // GET: Retrieve customer by customer ID
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable @Positive Long id) {
        return customerService.getCustomerById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET: Retrieve customer by associated user ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<Customer> getCustomerByUserId(@PathVariable @Positive Long userId) {
        Customer customer = customerService.getCustomerByUserId(userId);
        return ResponseEntity.ok(customer);
    }

    // GET: Stream profile image binary content
    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getCustomerImage(@PathVariable @Positive Long id) {
        Customer customer = customerService.getCustomerById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        byte[] imageData = customerService.getCustomerImage(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(customer.getImageType() != null ? customer.getImageType() : "image/jpeg"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"customer-" + id + "\"")
                .body(imageData);
    }

    // PUT: Update customer entity and optional image
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Customer> updateCustomer(
            @PathVariable @Positive Long id,
            @RequestPart("customer") @Valid Customer customer,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        Customer updated = customerService.updateCustomer(id, customer, image);
        return ResponseEntity.ok(updated);
    }

    // PATCH: Partially update customer fields
    @PatchMapping("/{id}")
    public ResponseEntity<Customer> patchCustomer(
            @PathVariable @Positive Long id,
            @RequestBody Customer customer) {
        Customer patched = customerService.patchCustomer(id, customer);
        return ResponseEntity.ok(patched);
    }

    // PATCH: Update only the profile image
    @PatchMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Customer> updateCustomerImage(
            @PathVariable @Positive Long id,
            @RequestPart("image") MultipartFile image) throws IOException {
        Customer updated = customerService.updateCustomerImage(id, image);
        return ResponseEntity.ok(updated);
    }

    // DELETE: Remove customer profile image
    @DeleteMapping("/{id}/image")
    public ResponseEntity<Void> removeCustomerImage(@PathVariable @Positive Long id) {
        customerService.removeCustomerImage(id);
        return ResponseEntity.noContent().build();
    }

    // DELETE: Remove customer entity
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable @Positive Long id) {
        boolean deleted = customerService.deleteCustomer(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // --- ADMIN OPERATIONS ---

    // PUT: Direct administrative update for customer records
    @PutMapping("/admin/{id}")
    public ResponseEntity<Customer> updateCustomerByAdmin(
            @PathVariable @Positive Long id,
            @RequestBody Customer customer) {
        return customerService.updateCustomerByAdmin(id, customer)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DELETE: Direct administrative deletion for customer records
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteCustomerByAdmin(@PathVariable @Positive Long id) {
        boolean deleted = customerService.deleteCustomerByAdmin(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    //BOOKING MANAGEMENT
    @PostMapping("/request/{carId}")
    public ResponseEntity<Booking> createBookingRequest(
            @PathVariable @Positive Long carId,
            @Valid @RequestBody Booking bookingRequest) {
        Booking createdBooking = bookingService.createBookingRequest(carId, bookingRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBooking);
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings());
    }


//    @GetMapping("/agencies")
//    pub0
}