package com.warehouse.inventory.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The frontend sends "requestedQuantity"; "quantity" is accepted as an alias. */
public record CreateOrderRequest(
        @NotBlank(message = "Product ID is required and cannot be blank.")
        @Size(max = 30, message = "Product ID must not exceed 30 characters.")
        String productId,

        @JsonAlias("quantity")
        JsonNode requestedQuantity,

        @Size(max = 500, message = "Notes must not exceed 500 characters.")
        String notes) {

    public CreateOrderRequest {
        productId = productId == null ? null : productId.trim();
        notes = (notes == null || notes.isBlank()) ? null : notes.trim();
    }
}
