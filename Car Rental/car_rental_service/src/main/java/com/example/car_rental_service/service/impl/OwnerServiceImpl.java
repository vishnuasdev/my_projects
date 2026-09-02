package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.entity.Address;
import com.example.car_rental_service.model.entity.User;
import com.example.car_rental_service.model.entity.users.Owner;
import com.example.car_rental_service.model.enums.Role;
import com.example.car_rental_service.repository.OwnerRepository;
import com.example.car_rental_service.repository.UserRepository;
import com.example.car_rental_service.service.OwnerService;
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
public class OwnerServiceImpl implements OwnerService {

    private final OwnerRepository ownerRepository;
    private final UserRepository userRepository;

    public OwnerServiceImpl(OwnerRepository ownerRepository, UserRepository userRepository) {
        this.ownerRepository = ownerRepository;
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
    public Owner createOwner(Owner owner, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found for email: " + email));

        // Ensure user has OWNER role
        if (user.getRole() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User role must be OWNER to create an owner profile.");
        }

        // Prevent duplicate owner profiles for the same user
        if (ownerRepository.findByUserEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An owner profile already exists for this user.");
        }

        owner.setUser(user);

        if (image != null && !image.isEmpty()) {
            owner.setImageType(image.getContentType());
            owner.setProfileImage(image.getBytes());
        }

        return ownerRepository.save(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Owner> getAllOwners() {
        return ownerRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Owner> getOwnerById(Long id) {
        return ownerRepository.findById(id);
    }

    @Override
    public Owner updateOwner(Long id, Owner updatedOwner, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        Owner existingOwner = ownerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found with ID: " + id));

        if (existingOwner.getUser() == null || !existingOwner.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own owner profile.");
        }

        existingOwner.setName(updatedOwner.getName());
        existingOwner.setDob(updatedOwner.getDob());
        existingOwner.setLocation(updatedOwner.getLocation());

        if (updatedOwner.getAddress() != null) {
            existingOwner.setAddress(updatedOwner.getAddress());
        }

        if (image != null && !image.isEmpty()) {
            existingOwner.setImageType(image.getContentType());
            existingOwner.setProfileImage(image.getBytes());
        }

        return ownerRepository.save(existingOwner);
    }

    @Override
    public Owner patchOwner(Long id, Owner partialOwner) {
        String email = getAuthenticatedUserEmail();
        Owner owner = ownerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found with ID: " + id));

        if (owner.getUser() == null || !owner.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own owner profile.");
        }

        if (partialOwner.getName() != null && !partialOwner.getName().isBlank()) {
            owner.setName(partialOwner.getName());
        }
        if (partialOwner.getDob() != null && !partialOwner.getDob().isBlank()) {
            owner.setDob(partialOwner.getDob());
        }
        if (partialOwner.getLocation() != null && !partialOwner.getLocation().isBlank()) {
            owner.setLocation(partialOwner.getLocation());
        }
        if (partialOwner.getAddress() != null) {
            owner.setAddress(partialOwner.getAddress());
        }

        return ownerRepository.save(owner);
    }

    @Override
    public Owner updateOwnerImage(Long id, MultipartFile image) throws IOException {
        String email = getAuthenticatedUserEmail();
        Owner owner = ownerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found with ID: " + id));

        if (owner.getUser() == null || !owner.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own owner profile image.");
        }

        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file cannot be empty.");
        }

        owner.setImageType(image.getContentType());
        owner.setProfileImage(image.getBytes());

        return ownerRepository.save(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getOwnerImage(Long id) {
        Owner owner = ownerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found with ID: " + id));

        if (owner.getProfileImage() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile image found for owner ID: " + id);
        }

        return owner.getProfileImage();
    }

    @Override
    public boolean deleteOwner(Long id) {
        String email = getAuthenticatedUserEmail();
        return ownerRepository.findById(id).map(owner -> {
            if (owner.getUser() == null || !owner.getUser().getEmail().equals(email)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own owner profile.");
            }
            ownerRepository.delete(owner);
            return true;
        }).orElse(false);
    }

    // --- ADMIN OPERATIONS ---

    @Override
    public Optional<Owner> updateOwnerByAdmin(Long id, Owner updateData) {
        Optional<Owner> optionalOwner = ownerRepository.findById(id);
        if (optionalOwner.isEmpty()) {
            return Optional.empty();
        }

        Owner owner = optionalOwner.get();

        if (updateData.getName() != null) {
            owner.setName(updateData.getName());
        }
        if (updateData.getDob() != null) {
            owner.setDob(updateData.getDob());
        }
        if (updateData.getLocation() != null) {
            owner.setLocation(updateData.getLocation());
        }
        if (updateData.getAddress() != null) {
            Address address = owner.getAddress();
            if (address == null) {
                address = new Address();
                owner.setAddress(address);
            }
            applyAddressUpdate(address, updateData.getAddress());
        }

        return Optional.of(ownerRepository.save(owner));
    }

    @Override
    public boolean deleteOwnerByAdmin(Long id) {
        if (ownerRepository.existsById(id)) {
            ownerRepository.deleteById(id);
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

    @Override
    @Transactional
    public Owner saveOwnerProfile(Owner owner) {
        return ownerRepository.save(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Owner> getOwnerByUserId(Long userId) {
        return ownerRepository.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Owner> getOwnerByUserEmail(String email) {
        return ownerRepository.findByEmail(email);
    }

    @Override
    @Transactional
    public Owner updateOwnerProfile(String email, Owner updatedOwnerData, MultipartFile imageFile) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        Owner owner = ownerRepository.findByEmail(email)
                .orElseGet(() -> {
                    Owner newOwner = new Owner();
                    newOwner.setUser(user);
                    return newOwner;
                });

        if (updatedOwnerData.getName() != null) owner.setName(updatedOwnerData.getName());
        if (updatedOwnerData.getDob() != null) owner.setDob(updatedOwnerData.getDob());
        if (updatedOwnerData.getLocation() != null) owner.setLocation(updatedOwnerData.getLocation());
        if (updatedOwnerData.getAddress() != null) owner.setAddress(updatedOwnerData.getAddress());

        if (imageFile != null && !imageFile.isEmpty()) {
            owner.setProfileImage(imageFile.getBytes());
            owner.setImageType(imageFile.getContentType());
        }

        return ownerRepository.save(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getOwnerProfileImage(Long ownerId) {
        return ownerRepository.findById(ownerId)
                .map(Owner::getProfileImage)
                .orElse(new byte[0]);
    }
}