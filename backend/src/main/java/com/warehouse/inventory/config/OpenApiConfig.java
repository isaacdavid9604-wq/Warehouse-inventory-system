package com.warehouse.inventory.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI warehouseOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Warehouse Inventory Management API")
                .version("1.0.0")
                .description("Products, stock updates, availability checks, orders, stock history and dashboard."));
    }
}
