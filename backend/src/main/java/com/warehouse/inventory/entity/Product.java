package com.warehouse.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @Column(name = "product_id", length = 30, nullable = false, updatable = false)
    private String productId;

    @Column(name = "product_name", length = 100, nullable = false)
    private String productName;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    /** Optimistic-lock backstop in addition to the pessimistic row locks used by the services. */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Product() {
    }

    public Product(String productId, String productName, int stockQuantity) {
        this.productId = productId;
        this.productName = productName;
        this.stockQuantity = stockQuantity;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        if (stockQuantity < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative");
        }
        this.stockQuantity = stockQuantity;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
