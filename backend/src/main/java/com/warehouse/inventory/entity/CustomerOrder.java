package com.warehouse.inventory.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Named CustomerOrder because ORDER is a reserved SQL word; the table is "orders". */
@Entity
@Table(name = "orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private OrderStatus status;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();

    protected CustomerOrder() {
    }

    public CustomerOrder(OrderStatus status, String notes) {
        this.status = status;
        this.notes = notes;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }

    /** Public identifier shown to API clients, e.g. ORD-000042. */
    public String getOrderCode() {
        return formatOrderCode(id);
    }

    public static String formatOrderCode(Long id) {
        return String.format("ORD-%06d", id);
    }

    public Long getId() {
        return id;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<OrderItem> getItems() {
        return items;
    }
}
