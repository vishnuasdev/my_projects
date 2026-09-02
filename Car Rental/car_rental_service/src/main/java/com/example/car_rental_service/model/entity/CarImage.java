package com.example.car_rental_service.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "car_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stores full MIME type (e.g., "image/jpeg", "image/png")
    @Column(name = "content_type")
    private String imageType;

    @Lob
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] imageData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id")
    @JsonIgnore
    private Car car;
}