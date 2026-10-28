package com.warehouse.inventory.service;

import com.warehouse.inventory.config.InventoryProperties;
import com.warehouse.inventory.dto.CreateOrderRequest;
import com.warehouse.inventory.dto.OrderResponse;
import com.warehouse.inventory.entity.CustomerOrder;
import com.warehouse.inventory.entity.OperationType;
import com.warehouse.inventory.entity.OrderItem;
import com.warehouse.inventory.entity.OrderStatus;
import com.warehouse.inventory.entity.Product;
import com.warehouse.inventory.exception.InsufficientStockException;
import com.warehouse.inventory.exception.ResourceNotFoundException;
import com.warehouse.inventory.repository.OrderRepository;
import com.warehouse.inventory.repository.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StockHistoryService stockHistoryService;
    private final InventoryProperties properties;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        StockHistoryService stockHistoryService,
                        InventoryProperties properties) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.stockHistoryService = stockHistoryService;
        this.properties = properties;
    }

    /**
     * Anti-overselling strategy: the product row is read with SELECT ... FOR UPDATE (pessimistic
     * write lock). A second order for the same product blocks on that lock until the first
     * transaction commits, then re-reads the already-reduced stock and re-checks it. Check, deduct,
     * order insert and history insert all commit (or roll back) together. The @Version column on
     * Product and the CHECK (stock_quantity >= 0) constraint are additional safety nets.
     */
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        int quantity = QuantityParser.parseOrderQuantity(
                JsonQuantityAccess.rawText(request.requestedQuantity()), properties.maxStockQuantity());

        Product product = productRepository.findForUpdate(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product with ID \"" + request.productId() + "\" was not found."));

        int available = product.getStockQuantity();
        if (available < quantity) {
            // Nothing has been written yet; the exception also guarantees rollback.
            throw new InsufficientStockException("Insufficient stock for \"" + product.getProductName()
                    + "\". Available: " + available + ", requested: " + quantity + ".");
        }

        int remaining = available - quantity;
        product.setStockQuantity(remaining);
        productRepository.saveAndFlush(product);

        CustomerOrder order = new CustomerOrder(OrderStatus.FULFILLED, request.notes());
        order.addItem(new OrderItem(product.getProductId(), product.getProductName(), quantity));
        order = orderRepository.saveAndFlush(order);

        stockHistoryService.record(product, available, remaining, OperationType.ORDER_FULFILLMENT,
                "Order " + order.getOrderCode() + " fulfilled");

        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listOrders() {
        return orderRepository.findAllByOrderByIdDesc().stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(String orderId) {
        Long id = parseOrderId(orderId);
        return orderRepository.findById(id)
                .map(OrderResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Order \"" + orderId + "\" was not found."));
    }

    /** Accepts "ORD-000042", "ord-42" or "42". */
    private static Long parseOrderId(String orderId) {
        String text = orderId.trim().toUpperCase();
        if (text.startsWith("ORD-")) {
            text = text.substring(4);
        }
        if (!text.matches("\\d{1,18}")) {
            throw new ResourceNotFoundException("Order \"" + orderId + "\" was not found.");
        }
        return Long.parseLong(text);
    }
}
