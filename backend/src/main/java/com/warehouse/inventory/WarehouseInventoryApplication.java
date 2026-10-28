package com.warehouse.inventory;

import com.warehouse.inventory.config.InventoryProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(InventoryProperties.class)
public class WarehouseInventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(WarehouseInventoryApplication.class, args);
    }
}
