package com.warehouse.inventory.dto;

import com.warehouse.inventory.entity.OperationType;
import com.warehouse.inventory.entity.StockHistory;
import java.time.Instant;

public record StockHistoryResponse(
        String id,
        String productId,
        String productName,
        int previousQuantity,
        int newQuantity,
        int quantityChange,
        OperationType operationType,
        Instant timestamp,
        String note) {

    public static StockHistoryResponse from(StockHistory h) {
        return new StockHistoryResponse(
                String.format("HIST-%06d", h.getId()),
                h.getProductId(),
                h.getProductName(),
                h.getPreviousQuantity(),
                h.getNewQuantity(),
                h.getQuantityChange(),
                h.getOperationType(),
                h.getCreatedAt(),
                h.getNote());
    }
}
