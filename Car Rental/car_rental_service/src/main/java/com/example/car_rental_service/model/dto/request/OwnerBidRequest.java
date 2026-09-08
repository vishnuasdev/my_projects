package com.example.car_rental_service.model.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record OwnerBidRequest(
        @NotNull Long carId,
        @NotNull Long agencyId,
        @NotNull @DecimalMin(value = "0.01") Double ratePerDay
) {
}
