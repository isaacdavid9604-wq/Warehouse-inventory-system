package com.warehouse.inventory.service;

import com.warehouse.inventory.config.InventoryProperties;
import com.warehouse.inventory.dto.ProductResponse;
import com.warehouse.inventory.dto.StockStatus;
import com.warehouse.inventory.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    private final InventoryProperties properties;

    public ProductMapper(InventoryProperties properties) {
        this.properties = properties;
    }

    public StockStatus statusOf(int quantity) {
        if (quantity == 0) {
            return StockStatus.OUT_OF_STOCK;
        }
        return quantity < properties.lowStockThreshold() ? StockStatus.LOW_STOCK : StockStatus.IN_STOCK;
    }

    public ProductResponse toResponse(Product p) {
        return new ProductResponse(p.getProductId(), p.getProductName(), p.getStockQuantity(),
                statusOf(p.getStockQuantity()), p.getCreatedAt(), p.getUpdatedAt());
    }
}
