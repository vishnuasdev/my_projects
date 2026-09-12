package com.example.car_rental_service.service;

import com.example.car_rental_service.model.entity.users.Customer;
import com.example.car_rental_service.model.entity.users.Owner;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface OwnerService {
    Owner saveOwnerProfile(Owner owner);
    Optional<Owner> getOwnerByUserId(Long userId);
    Optional<Owner> getOwnerByUserEmail(String email);
    Owner updateOwnerProfile(String email, Owner updatedOwnerData, MultipartFile imageFile) throws IOException;
    byte[] getOwnerProfileImage(Long ownerId);

    // --- CRUD OPERATIONS ---
    Owner createOwner(Owner owner, MultipartFile image) throws IOException;

    List<Owner> getAllOwners();

    Optional<Owner> getOwnerById(Long id);

    Owner updateOwner(Long id, Owner updatedOwner, MultipartFile image) throws IOException;

    Owner patchOwner(Long id, Owner partialOwner);

    Owner updateOwnerImage(Long id, MultipartFile image) throws IOException;

    byte[] getOwnerImage(Long id);

    boolean deleteOwner(Long id);

    Owner getMyProfile();

    void removeMyProfileImage();

    // --- ADMIN OPERATIONS ---
    Optional<Owner> updateOwnerByAdmin(Long id, Owner updateData);

    boolean deleteOwnerByAdmin(Long id);
}