package com.warehouse.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "stock_history")
public class StockHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", length = 30, nullable = false)
    private String productId;

    @Column(name = "product_name", length = 100, nullable = false)
    private String productName;

    @Column(name = "previous_quantity", nullable = false)
    private int previousQuantity;

    @Column(name = "new_quantity", nullable = false)
    private int newQuantity;

    @Column(name = "quantity_change", nullable = false)
    private int quantityChange;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", length = 30, nullable = false)
    private OperationType operationType;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected StockHistory() {
    }

    public StockHistory(String productId, String productName, int previousQuantity, int newQuantity,
                        OperationType operationType, String note) {
        this.productId = productId;
        this.productName = productName;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.quantityChange = newQuantity - previousQuantity;
        this.operationType = operationType;
        this.note = note;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public int getPreviousQuantity() {
        return previousQuantity;
    }

    public int getNewQuantity() {
        return newQuantity;
    }

    public int getQuantityChange() {
        return quantityChange;
    }

    public OperationType getOperationType() {
        return operationType;
    }

    public String getNote() {
        return note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
