package com.warehouse.inventory.dto;

import com.warehouse.inventory.entity.CustomerOrder;
import com.warehouse.inventory.entity.OrderItem;
import com.warehouse.inventory.entity.OrderStatus;
import java.time.Instant;
import java.util.List;

/**
 * Flat fields (productId, productName, requestedQuantity) mirror the first item for the current
 * frontend; "items" carries the full list so multi-item orders can be added later.
 */
public record OrderResponse(
        String orderId,
        String productId,
        String productName,
        int requestedQuantity,
        OrderStatus status,
        Instant createdAt,
        String notes,
        List<OrderItemResponse> items) {

    public static OrderResponse from(CustomerOrder order) {
        OrderItem first = order.getItems().get(0);
        List<OrderItemResponse> items = order.getItems().stream()
                .map(i -> new OrderItemResponse(i.getProductId(), i.getProductName(), i.getQuantity()))
                .toList();
        return new OrderResponse(
                order.getOrderCode(),
                first.getProductId(),
                first.getProductName(),
                first.getQuantity(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getNotes(),
                items);
    }
}
