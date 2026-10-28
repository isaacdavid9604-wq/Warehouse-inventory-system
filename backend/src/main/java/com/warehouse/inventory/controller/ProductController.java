package com.warehouse.inventory.controller;

import com.warehouse.inventory.dto.AvailabilityResponse;
import com.warehouse.inventory.dto.CreateProductRequest;
import com.warehouse.inventory.dto.ProductResponse;
import com.warehouse.inventory.dto.StockUpdateResponse;
import com.warehouse.inventory.dto.UpdateStockRequest;
import com.warehouse.inventory.service.JsonQuantityAccess;
import com.warehouse.inventory.service.ProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse created = productService.createProduct(request);
        return ResponseEntity.created(URI.create("/api/products/" + created.productId())).body(created);
    }

    @GetMapping
    public List<ProductResponse> list(@RequestParam(required = false) String search) {
        return productService.listProducts(search);
    }

    @GetMapping("/{productId}")
    public ProductResponse get(@PathVariable String productId) {
        return productService.getProduct(productId);
    }

    @PatchMapping("/{productId}/stock")
    public StockUpdateResponse updateStock(@PathVariable String productId,
                                           @RequestBody UpdateStockRequest request) {
        return productService.updateStock(productId, JsonQuantityAccess.rawText(request.quantity()));
    }

    /** quantity is received as text so "abc" or "2.5" yields a clear 400 instead of a binding error. */
    @GetMapping("/{productId}/availability")
    public AvailabilityResponse availability(@PathVariable String productId,
                                             @RequestParam(required = false) String quantity) {
        return productService.checkAvailability(productId, quantity);
    }
}
