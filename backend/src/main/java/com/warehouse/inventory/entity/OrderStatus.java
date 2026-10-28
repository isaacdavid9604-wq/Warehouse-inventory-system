package com.warehouse.inventory.entity;

/** PENDING/REJECTED/CANCELLED exist so the frontend enum matches; only FULFILLED is produced today. */
public enum OrderStatus {
    PENDING,
    FULFILLED,
    REJECTED,
    CANCELLED
}
