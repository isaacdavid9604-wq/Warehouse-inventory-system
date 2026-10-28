package com.warehouse.inventory.dto;

public record OrderItemResponse(String productId, String productName, int quantity) {
}
