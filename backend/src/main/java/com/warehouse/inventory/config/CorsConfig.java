package com.warehouse.inventory.config;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final InventoryProperties properties;

    public CorsConfig(InventoryProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = properties.cors().allowedOrigins().stream()
                .map(String::trim)
                .map(o -> o.endsWith("/") ? o.substring(0, o.length() - 1) : o)
                .filter(o -> !o.isEmpty())
                .toList();
        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
