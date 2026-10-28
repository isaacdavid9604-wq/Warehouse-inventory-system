package com.warehouse.inventory.dto;

import java.time.Instant;

/** Product fields plus previousQuantity so the caller sees both old and new stock. */
public record StockUpdateResponse(
        String productId,
        String productName,
        int quantity,
        int previousQuantity,
        StockStatus status,
        Instant createdAt,
        Instant updatedAt) {
}
