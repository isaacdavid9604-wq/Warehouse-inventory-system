package com.warehouse.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;

class ProductApiTest extends AbstractApiTest {

    private static final String PRODUCTS = "/api/products";

    @Test
    void createsValidProductWithZeroStockAndTrimsInput() throws Exception {
        mockMvc.perform(post(PRODUCTS).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"  P104  \",\"productName\":\"  Laptop  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.productId").value("P104"))
                .andExpect(jsonPath("$.productName").value("Laptop"))
                .andExpect(jsonPath("$.quantity").value(0))
                .andExpect(jsonPath("$.status").value("OUT_OF_STOCK"))
                .andExpect(jsonPath("$.createdAt").exists());
        assertThat(productRepository.count()).isEqualTo(1);
    }

    @Test
    void createsProductWithExplicitInitialQuantityAndRecordsHistory() throws Exception {
        mockMvc.perform(post(PRODUCTS).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"P105\",\"productName\":\"Webcam\",\"initialQuantity\":12}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(12))
                .andExpect(jsonPath("$.status").value("IN_STOCK"));
        assertThat(stockHistoryRepository.count()).isEqualTo(1);
    }

    @Test
    void rejectsDuplicateProductIdWithConflictAndKeepsOriginal() throws Exception {
        saveProduct("P101", "Keyboard", 20);

        mockMvc.perform(post(PRODUCTS).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"P101\",\"productName\":\"Something else\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("already exists")));

        assertThat(productRepository.count()).isEqualTo(1);
        assertThat(productRepository.findById("P101").orElseThrow().getProductName()).isEqualTo("Keyboard");
        assertThat(stockOf("P101")).isEqualTo(20);
    }

    @Test
    void duplicateCheckIgnoresCase() throws Exception {
        saveProduct("P101", "Keyboard", 20);
        mockMvc.perform(post(PRODUCTS).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"p101\",\"productName\":\"Clone\"}"))
                .andExpect(status().isConflict());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"productId\":\"\",\"productName\":\"Laptop\"}",
            "{\"productId\":\"   \",\"productName\":\"Laptop\"}",
            "{\"productName\":\"Laptop\"}",
            "{\"productId\":\"P104\",\"productName\":\"\"}",
            "{\"productId\":\"P104\",\"productName\":\"     \"}",
            "{\"productId\":\"P104\"}",
            "{\"productId\":\"P104\",\"productName\":\"Laptop\",\"initialQuantity\":-1}",
            "{\"productId\":\"P104\",\"productName\":\"Laptop\",\"initialQuantity\":2.5}",
            "{\"productId\":\"P104\",\"productName\":\"Laptop\",\"initialQuantity\":\"abc\"}"
    })
    void rejectsInvalidProductPayloadsWithBadRequest(String json) throws Exception {
        mockMvc.perform(post(PRODUCTS).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.path").value(PRODUCTS));
        assertThat(productRepository.count()).isZero();
    }

    @Test
    void rejectsMalformedJson() throws Exception {
        mockMvc.perform(post(PRODUCTS).contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listsSearchesAndFetchesProducts() throws Exception {
        saveProduct("P101", "Keyboard", 20);
        saveProduct("P102", "Mouse", 30);

        mockMvc.perform(get(PRODUCTS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].productId").value("P101"));

        mockMvc.perform(get(PRODUCTS).param("search", "keyb"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].productName").value("Keyboard"));

        mockMvc.perform(get(PRODUCTS + "/P102"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(30));
    }

    @Test
    void returnsNotFoundForUnknownProduct() throws Exception {
        mockMvc.perform(get(PRODUCTS + "/NOPE"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
