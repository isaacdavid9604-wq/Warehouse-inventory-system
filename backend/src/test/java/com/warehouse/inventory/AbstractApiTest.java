package com.warehouse.inventory;

import com.warehouse.inventory.entity.Product;
import com.warehouse.inventory.repository.OrderRepository;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.repository.StockHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractApiTest {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ProductRepository productRepository;
    @Autowired protected OrderRepository orderRepository;
    @Autowired protected StockHistoryRepository stockHistoryRepository;

    @BeforeEach
    void cleanDatabase() {
        stockHistoryRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
    }

    protected Product saveProduct(String id, String name, int quantity) {
        return productRepository.saveAndFlush(new Product(id, name, quantity));
    }

    protected int stockOf(String id) {
        return productRepository.findByProductIdIgnoreCase(id).orElseThrow().getStockQuantity();
    }
}
