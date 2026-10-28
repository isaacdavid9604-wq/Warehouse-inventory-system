package com.warehouse.inventory.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.node.IntNode;
import com.warehouse.inventory.dto.CreateOrderRequest;
import com.warehouse.inventory.entity.Product;
import com.warehouse.inventory.exception.InsufficientStockException;
import com.warehouse.inventory.repository.OrderRepository;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.repository.StockHistoryRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Not @Transactional on purpose: each thread must run its own real database transaction. */
@SpringBootTest
@ActiveProfiles("test")
class OrderConcurrencyTest {

    @Autowired OrderService orderService;
    @Autowired ProductRepository productRepository;
    @Autowired OrderRepository orderRepository;
    @Autowired StockHistoryRepository stockHistoryRepository;

    @BeforeEach
    void clean() {
        stockHistoryRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
    }

    @Test
    void concurrentOrdersCannotOversellInventory() throws Exception {
        final int stock = 5;
        final int threads = 20;
        productRepository.saveAndFlush(new Product("P500", "Scanner", stock));

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<String>> results = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            results.add(pool.submit(() -> {
                ready.countDown();
                go.await();
                try {
                    orderService.createOrder(new CreateOrderRequest("P500", IntNode.valueOf(1), null));
                    return "OK";
                } catch (InsufficientStockException ex) {
                    return "REJECTED";
                }
            }));
        }
        ready.await(10, TimeUnit.SECONDS);
        go.countDown();

        int accepted = 0;
        int rejected = 0;
        for (Future<String> f : results) {
            String r = f.get(60, TimeUnit.SECONDS); // any other exception fails the test here
            if (r.equals("OK")) accepted++; else rejected++;
        }
        pool.shutdown();

        assertThat(accepted).isEqualTo(stock);
        assertThat(rejected).isEqualTo(threads - stock);
        assertThat(productRepository.findById("P500").orElseThrow().getStockQuantity()).isZero();
        assertThat(orderRepository.count()).isEqualTo(stock);
        assertThat(stockHistoryRepository.count()).isEqualTo(stock);
    }
}
