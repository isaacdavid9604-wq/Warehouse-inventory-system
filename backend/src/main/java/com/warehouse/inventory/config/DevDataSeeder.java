package com.warehouse.inventory.config;

import com.warehouse.inventory.entity.OperationType;
import com.warehouse.inventory.entity.Product;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.service.StockHistoryService;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Optional sample data (P101/P102/P103). Controlled by inventory.seed.enabled (env SEED_ENABLED).
 * Only inserts products whose ID does not exist yet; never updates or deletes existing rows.
 */
@Component
@ConditionalOnProperty(prefix = "inventory.seed", name = "enabled", havingValue = "true")
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private record SeedProduct(String id, String name, int quantity) {
    }

    private static final List<SeedProduct> SEED = List.of(
            new SeedProduct("P101", "Keyboard", 20),
            new SeedProduct("P102", "Mouse", 30),
            new SeedProduct("P103", "Monitor", 15));

    private final ProductRepository productRepository;
    private final StockHistoryService stockHistoryService;
    private final TransactionTemplate transactionTemplate;

    public DevDataSeeder(ProductRepository productRepository,
                         StockHistoryService stockHistoryService,
                         TransactionTemplate transactionTemplate) {
        this.productRepository = productRepository;
        this.stockHistoryService = stockHistoryService;
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public void run(String... args) {
        for (SeedProduct seed : SEED) {
            transactionTemplate.executeWithoutResult(status -> {
                if (productRepository.existsByProductIdIgnoreCase(seed.id())) {
                    return;
                }
                Product product = productRepository.saveAndFlush(new Product(seed.id(), seed.name(), seed.quantity()));
                stockHistoryService.record(product, 0, seed.quantity(), OperationType.INITIAL, "Seed data");
                log.info("Seeded product {} ({})", seed.id(), seed.name());
            });
        }
    }
}
