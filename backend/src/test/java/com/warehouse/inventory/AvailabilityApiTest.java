package com.warehouse.inventory;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class AvailabilityApiTest extends AbstractApiTest {

    @BeforeEach
    void seed() {
        saveProduct("P101", "Keyboard", 20);
    }

    @Test
    void sufficientStockIsAvailable() throws Exception {
        mockMvc.perform(get("/api/products/P101/availability").param("quantity", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value("P101"))
                .andExpect(jsonPath("$.productName").value("Keyboard"))
                .andExpect(jsonPath("$.availableQuantity").value(20))
                .andExpect(jsonPath("$.requestedQuantity").value(10))
                .andExpect(jsonPath("$.isAvailable").value(true))
                .andExpect(jsonPath("$.shortage").value(0))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void exactStockIsAvailable() throws Exception {
        mockMvc.perform(get("/api/products/P101/availability").param("quantity", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isAvailable").value(true));
    }

    @Test
    void insufficientStockIsAValidResponseWithAvailableFalse() throws Exception {
        mockMvc.perform(get("/api/products/P101/availability").param("quantity", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isAvailable").value(false))
                .andExpect(jsonPath("$.shortage").value(30))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Insufficient")));
    }

    @Test
    void unknownProductIsNotFound() throws Exception {
        mockMvc.perform(get("/api/products/P999/availability").param("quantity", "1"))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-5", "2.5", "abc", "", "99999999999"})
    void invalidQuantityIsBadRequest(String quantity) throws Exception {
        mockMvc.perform(get("/api/products/P101/availability").param("quantity", quantity))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingQuantityIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/products/P101/availability"))
                .andExpect(status().isBadRequest());
    }
}
