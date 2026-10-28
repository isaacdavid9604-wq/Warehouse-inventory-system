package com.warehouse.inventory.service;

import com.warehouse.inventory.config.InventoryProperties;
import com.warehouse.inventory.dto.DashboardSummaryResponse;
import com.warehouse.inventory.exception.InvalidRequestException;
import com.warehouse.inventory.repository.OrderRepository;
import com.warehouse.inventory.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final InventoryProperties properties;

    public DashboardService(ProductRepository productRepository,
                            OrderRepository orderRepository,
                            InventoryProperties properties) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(Integer thresholdOverride) {
        int threshold = thresholdOverride == null ? properties.lowStockThreshold() : thresholdOverride;
        if (threshold < 1) {
            throw new InvalidRequestException("Threshold must be a positive whole number.");
        }
        return new DashboardSummaryResponse(
                productRepository.count(),
                productRepository.sumStockUnits(),
                productRepository.countLowStock(threshold),
                productRepository.countByStockQuantity(0),
                orderRepository.count(),
                threshold);
    }
}
