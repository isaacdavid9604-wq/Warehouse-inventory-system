package com.warehouse.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.warehouse.inventory.entity.OperationType;
import com.warehouse.inventory.entity.StockHistory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

class StockUpdateApiTest extends AbstractApiTest {

    @BeforeEach
    void seed() {
        saveProduct("P101", "Keyboard", 20);
    }

    private ResultActions patchStock(String productId, String json) throws Exception {
        return mockMvc.perform(patch("/api/products/" + productId + "/stock")
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void updatesStockToValidQuantityAndRecordsHistory() throws Exception {
        patchStock("P101", "{\"quantity\":25}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(25))
                .andExpect(jsonPath("$.previousQuantity").value(20));

        assertThat(stockOf("P101")).isEqualTo(25);
        StockHistory h = stockHistoryRepository.findAll().get(0);
        assertThat(h.getOperationType()).isEqualTo(OperationType.STOCK_UPDATE);
        assertThat(h.getPreviousQuantity()).isEqualTo(20);
        assertThat(h.getNewQuantity()).isEqualTo(25);
        assertThat(h.getQuantityChange()).isEqualTo(5);
    }

    @Test
    void allowsZeroQuantity() throws Exception {
        patchStock("P101", "{\"quantity\":0}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(0))
                .andExpect(jsonPath("$.status").value("OUT_OF_STOCK"));
        assertThat(stockOf("P101")).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"quantity\":-1}",
            "{\"quantity\":2.5}",
            "{\"quantity\":25.0}",
            "{\"quantity\":\"abc\"}",
            "{\"quantity\":true}",
            "{\"quantity\":null}",
            "{}",
            "{\"quantity\":99999999999}",
            "{\"quantity\":2147483648}",
            "{\"quantity\":1000001}"
    })
    void rejectsInvalidQuantitiesAndLeavesStockUntouched(String json) throws Exception {
        patchStock("P101", json)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertThat(stockOf("P101")).isEqualTo(20);
        assertThat(stockHistoryRepository.count()).isZero();
    }

    @Test
    void returnsNotFoundForNonexistentProduct() throws Exception {
        patchStock("P999", "{\"quantity\":5}")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
        assertThat(stockHistoryRepository.count()).isZero();
    }

    @Test
    void rejectsMissingBody() throws Exception {
        mockMvc.perform(patch("/api/products/P101/stock").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}
