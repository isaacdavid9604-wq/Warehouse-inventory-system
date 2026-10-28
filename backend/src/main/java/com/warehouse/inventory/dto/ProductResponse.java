package com.warehouse.inventory.dto;

import java.time.Instant;

/** Matches the frontend "Product" type (the stock field is called "quantity"). */
public record ProductResponse(
        String productId,
        String productName,
        int quantity,
        StockStatus status,
        Instant createdAt,
        Instant updatedAt) {
}
