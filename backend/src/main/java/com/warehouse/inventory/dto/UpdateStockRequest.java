package com.warehouse.inventory.dto;

import com.fasterxml.jackson.databind.JsonNode;

/** quantity is a JsonNode so decimals / strings / booleans are rejected rather than coerced. */
public record UpdateStockRequest(JsonNode quantity) {
}
