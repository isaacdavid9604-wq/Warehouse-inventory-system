package com.warehouse.inventory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record AvailabilityResponse(
        String productId,
        String productName,
        int availableQuantity,
        int requestedQuantity,
        @JsonProperty("isAvailable") boolean available,
        int shortage,
        String message,
        Instant checkedAt) {
}
