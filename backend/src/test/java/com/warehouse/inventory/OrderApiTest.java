package com.warehouse.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

class OrderApiTest extends AbstractApiTest {

    @BeforeEach
    void seed() {
        saveProduct("P101", "Keyboard", 20);
    }

    private ResultActions postOrder(String json) throws Exception {
        return mockMvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void successfulOrderDeductsStockExactlyOnceAndRecordsHistory() throws Exception {
        postOrder("{\"productId\":\"P101\",\"requestedQuantity\":5,\"notes\":\"for lab\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value("ORD-" + String.format("%06d", orderRepository.findAll().get(0).getId())))
                .andExpect(jsonPath("$.productId").value("P101"))
                .andExpect(jsonPath("$.productName").value("Keyboard"))
                .andExpect(jsonPath("$.requestedQuantity").value(5))
                .andExpect(jsonPath("$.status").value("FULFILLED"))
                .andExpect(jsonPath("$.notes").value("for lab"))
                .andExpect(jsonPath("$.items.length()").value(1));

        assertThat(stockOf("P101")).isEqualTo(15);          // 20 - 5, exactly once
        assertThat(orderRepository.count()).isEqualTo(1);
        assertThat(stockHistoryRepository.count()).isEqualTo(1);
        StockHistory h = stockHistoryRepository.findAll().get(0);
        assertThat(h.getOperationType()).isEqualTo(OperationType.ORDER_FULFILLMENT);
        assertThat(h.getPreviousQuantity()).isEqualTo(20);
        assertThat(h.getNewQuantity()).isEqualTo(15);
        assertThat(h.getQuantityChange()).isEqualTo(-5);
    }

    @Test
    void acceptsQuantityAliasInRequestBody() throws Exception {
        postOrder("{\"productId\":\"P101\",\"quantity\":2}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requestedQuantity").value(2));
        assertThat(stockOf("P101")).isEqualTo(18);
    }

    @Test
    void insufficientStockIsRejectedWithoutSideEffects() throws Exception {
        postOrder("{\"productId\":\"P101\",\"requestedQuantity\":21}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Insufficient stock")));

        assertThat(stockOf("P101")).isEqualTo(20);
        assertThat(orderRepository.count()).isZero();
        assertThat(stockHistoryRepository.count()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"productId\":\"P101\",\"requestedQuantity\":0}",
            "{\"productId\":\"P101\",\"requestedQuantity\":-3}",
            "{\"productId\":\"P101\",\"requestedQuantity\":1.5}",
            "{\"productId\":\"P101\",\"requestedQuantity\":\"many\"}",
            "{\"productId\":\"P101\"}",
            "{\"requestedQuantity\":1}",
            "{\"productId\":\"   \",\"requestedQuantity\":1}"
    })
    void invalidOrdersAreBadRequestWithoutSideEffects(String json) throws Exception {
        postOrder(json).andExpect(status().isBadRequest());

        assertThat(stockOf("P101")).isEqualTo(20);
        assertThat(orderRepository.count()).isZero();
        assertThat(stockHistoryRepository.count()).isZero();
    }

    @Test
    void nonexistentProductIsNotFound() throws Exception {
        postOrder("{\"productId\":\"P999\",\"requestedQuantity\":1}")
                .andExpect(status().isNotFound());
        assertThat(orderRepository.count()).isZero();
    }

    @Test
    void listsAndFetchesOrders() throws Exception {
        postOrder("{\"productId\":\"P101\",\"requestedQuantity\":1}").andExpect(status().isCreated());
        postOrder("{\"productId\":\"P101\",\"requestedQuantity\":2}").andExpect(status().isCreated());

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].requestedQuantity").value(2)); // newest first

        Long firstId = orderRepository.findAll().get(0).getId();
        mockMvc.perform(get("/api/orders/ORD-" + String.format("%06d", firstId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedQuantity").value(1));

        mockMvc.perform(get("/api/orders/ORD-999999")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/orders/garbage")).andExpect(status().isNotFound());
    }

    @Test
    void stockHistoryEndpointListsAndFiltersByProduct() throws Exception {
        saveProduct("P102", "Mouse", 10);
        postOrder("{\"productId\":\"P101\",\"requestedQuantity\":1}").andExpect(status().isCreated());
        postOrder("{\"productId\":\"P102\",\"requestedQuantity\":1}").andExpect(status().isCreated());

        mockMvc.perform(get("/api/stock-history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mockMvc.perform(get("/api/stock-history").param("productId", "P102"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].productId").value("P102"))
                .andExpect(jsonPath("$[0].operationType").value("ORDER_FULFILLMENT"));
    }
}
