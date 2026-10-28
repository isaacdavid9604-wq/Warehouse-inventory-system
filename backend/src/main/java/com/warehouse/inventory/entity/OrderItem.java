package com.warehouse.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder order;

    @Column(name = "product_id", length = 30, nullable = false)
    private String productId;

    /** Snapshot of the product name at order time. */
    @Column(name = "product_name", length = 100, nullable = false)
    private String productName;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    protected OrderItem() {
    }

    public OrderItem(String productId, String productName, int quantity) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
    }

    void setOrder(CustomerOrder order) {
        this.order = order;
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

    public int getQuantity() {
        return quantity;
    }
}
