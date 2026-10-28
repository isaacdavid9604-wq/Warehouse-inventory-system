package com.warehouse.inventory.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Typed view of the "inventory.*" settings in application.properties. */
@ConfigurationProperties(prefix = "inventory")
public record InventoryProperties(
        @DefaultValue("5") int lowStockThreshold,
        @DefaultValue("1000000") int maxStockQuantity,
        @DefaultValue Seed seed,
        @DefaultValue Cors cors) {

    public record Seed(@DefaultValue("false") boolean enabled) {
    }

    public record Cors(@DefaultValue("http://localhost:5173") List<String> allowedOrigins) {
    }
}
