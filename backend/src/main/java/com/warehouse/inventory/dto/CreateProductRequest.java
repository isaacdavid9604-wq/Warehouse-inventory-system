package com.warehouse.inventory.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * initialQuantity is optional (defaults to 0). It is kept as a JsonNode so that decimals and
 * non-numeric values can be rejected explicitly instead of being silently coerced.
 */
public record CreateProductRequest(
        @NotBlank(message = "Product ID is required and cannot be blank or contain only whitespace.")
        @Size(max = 30, message = "Product ID must not exceed 30 characters.")
        String productId,

        @NotBlank(message = "Product name is required and cannot be blank or contain only whitespace.")
        @Size(max = 100, message = "Product name must not exceed 100 characters.")
        String productName,

        JsonNode initialQuantity) {

    public CreateProductRequest {
        productId = productId == null ? null : productId.trim();
        productName = productName == null ? null : productName.trim();
    }
}
