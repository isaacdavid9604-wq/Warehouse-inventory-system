package com.warehouse.inventory.service;

import com.warehouse.inventory.config.InventoryProperties;
import com.warehouse.inventory.dto.AvailabilityResponse;
import com.warehouse.inventory.dto.CreateProductRequest;
import com.warehouse.inventory.dto.ProductResponse;
import com.warehouse.inventory.dto.StockUpdateResponse;
import com.warehouse.inventory.entity.OperationType;
import com.warehouse.inventory.entity.Product;
import com.warehouse.inventory.exception.DuplicateResourceException;
import com.warehouse.inventory.exception.ResourceNotFoundException;
import com.warehouse.inventory.repository.ProductRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StockHistoryService stockHistoryService;
    private final ProductMapper mapper;
    private final InventoryProperties properties;

    public ProductService(ProductRepository productRepository,
                          StockHistoryService stockHistoryService,
                          ProductMapper mapper,
                          InventoryProperties properties) {
        this.productRepository = productRepository;
        this.stockHistoryService = stockHistoryService;
        this.mapper = mapper;
        this.properties = properties;
    }

    // ---------------------------------------------------------------- Module 1: add a product

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        String rawInitial = JsonQuantityAccess.rawText(request.initialQuantity());
        int initialQuantity = rawInitial == null
                ? 0
                : QuantityParser.parseStockQuantity(rawInitial, properties.maxStockQuantity());

        String productId = request.productId();
        if (productRepository.existsByProductIdIgnoreCase(productId)) {
            throw duplicate(productId);
        }

        Product product;
        try {
            product = productRepository.saveAndFlush(new Product(productId, request.productName(), initialQuantity));
        } catch (DataIntegrityViolationException ex) {
            // Two requests raced past the exists-check; the database unique key decided.
            throw duplicate(productId);
        }

        if (initialQuantity > 0) {
            stockHistoryService.record(product, 0, initialQuantity, OperationType.INITIAL,
                    "Product created with initial stock");
        }
        return mapper.toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listProducts(String search) {
        List<Product> products = (search == null || search.isBlank())
                ? productRepository.findAllByOrderByProductIdAsc()
                : productRepository.search(search.trim().toLowerCase());
        return products.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(String productId) {
        return mapper.toResponse(requireProduct(productId));
    }

    // ---------------------------------------------------------------- Module 2: update stock

    @Transactional
    public StockUpdateResponse updateStock(String productId, String rawQuantity) {
        // Validate input first: a bad quantity is a 400 regardless of the product.
        int newQuantity = QuantityParser.parseStockQuantity(rawQuantity, properties.maxStockQuantity());

        // SELECT ... FOR UPDATE: concurrent updates of the same product queue up here.
        Product product = productRepository.findForUpdate(productId.trim())
                .orElseThrow(() -> notFound(productId));

        int previousQuantity = product.getStockQuantity();
        product.setStockQuantity(newQuantity);
        productRepository.saveAndFlush(product);

        stockHistoryService.record(product, previousQuantity, newQuantity, OperationType.STOCK_UPDATE,
                "Stock updated manually from " + previousQuantity + " to " + newQuantity);

        return new StockUpdateResponse(product.getProductId(), product.getProductName(), newQuantity,
                previousQuantity, mapper.statusOf(newQuantity), product.getCreatedAt(), product.getUpdatedAt());
    }

    // ---------------------------------------------------------------- Module 3: availability

    @Transactional(readOnly = true)
    public AvailabilityResponse checkAvailability(String productId, String rawQuantity) {
        int requested = QuantityParser.parseOrderQuantity(rawQuantity, properties.maxStockQuantity());
        Product product = requireProduct(productId);

        int available = product.getStockQuantity();
        boolean isAvailable = available >= requested;
        int shortage = isAvailable ? 0 : requested - available;
        String message = isAvailable
                ? "Sufficient stock: " + available + " unit(s) available, " + requested + " requested."
                : "Insufficient stock: only " + available + " unit(s) available, " + requested
                + " requested (short by " + shortage + ").";

        return new AvailabilityResponse(product.getProductId(), product.getProductName(), available,
                requested, isAvailable, shortage, message, Instant.now());
    }

    // ---------------------------------------------------------------- helpers

    private Product requireProduct(String productId) {
        return productRepository.findByProductIdIgnoreCase(productId.trim())
                .orElseThrow(() -> notFound(productId));
    }

    private static ResourceNotFoundException notFound(String productId) {
        return new ResourceNotFoundException("Product with ID \"" + productId.trim() + "\" was not found.");
    }

    private static DuplicateResourceException duplicate(String productId) {
        return new DuplicateResourceException(
                "Product with ID \"" + productId + "\" already exists. Product IDs must be unique.");
    }
}
