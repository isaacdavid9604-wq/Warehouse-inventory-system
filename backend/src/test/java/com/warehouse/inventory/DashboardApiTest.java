package com.warehouse.inventory;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class DashboardApiTest extends AbstractApiTest {

    @Test
    void summaryIsCalculatedFromTheDatabase() throws Exception {
        saveProduct("A1", "Out", 0);
        saveProduct("A2", "Low", 3);
        saveProduct("A3", "Edge", 5);   // threshold 5 -> in stock
        saveProduct("A4", "Plenty", 20);

        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProducts").value(4))
                .andExpect(jsonPath("$.totalStockUnits").value(28))
                .andExpect(jsonPath("$.lowStockProducts").value(1))
                .andExpect(jsonPath("$.outOfStockProducts").value(1))
                .andExpect(jsonPath("$.totalOrders").value(0))
                .andExpect(jsonPath("$.lowStockThreshold").value(5));
    }

    @Test
    void thresholdQueryParameterOverridesDefault() throws Exception {
        saveProduct("A1", "Out", 0);
        saveProduct("A2", "Low", 3);
        saveProduct("A3", "Edge", 5);

        mockMvc.perform(get("/api/dashboard/summary").param("threshold", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lowStockProducts").value(2));
    }

    @Test
    void invalidThresholdIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary").param("threshold", "0"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/dashboard/summary").param("threshold", "abc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void emptyDatabaseYieldsZeros() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProducts").value(0))
                .andExpect(jsonPath("$.totalStockUnits").value(0));
    }
}
