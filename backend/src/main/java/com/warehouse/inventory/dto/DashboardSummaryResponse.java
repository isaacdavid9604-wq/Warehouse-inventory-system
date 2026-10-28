package com.warehouse.inventory.dto;

public record DashboardSummaryResponse(
        long totalProducts,
        long totalStockUnits,
        long lowStockProducts,
        long outOfStockProducts,
        long totalOrders,
        int lowStockThreshold) {
}
