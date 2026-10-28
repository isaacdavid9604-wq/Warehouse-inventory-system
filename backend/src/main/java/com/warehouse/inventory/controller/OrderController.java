package com.warehouse.inventory.controller;

import com.warehouse.inventory.dto.CreateOrderRequest;
import com.warehouse.inventory.dto.OrderResponse;
import com.warehouse.inventory.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse created = orderService.createOrder(request);
        return ResponseEntity.created(URI.create("/api/orders/" + created.orderId())).body(created);
    }

    @GetMapping
    public List<OrderResponse> list() {
        return orderService.listOrders();
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable String orderId) {
        return orderService.getOrder(orderId);
    }
}
