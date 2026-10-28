package com.warehouse.inventory.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.warehouse.inventory.exception.InvalidRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class QuantityParserTest {

    private static final int MAX = 1_000_000;

    @Test
    void acceptsZeroAndPositiveWholeNumbersForStock() {
        assertThat(QuantityParser.parseStockQuantity("0", MAX)).isZero();
        assertThat(QuantityParser.parseStockQuantity(" 25 ", MAX)).isEqualTo(25);
        assertThat(QuantityParser.parseStockQuantity("1000000", MAX)).isEqualTo(MAX);
    }

    @ParameterizedTest
    @ValueSource(strings = {"-1", "2.5", "25.0", "1e3", ".5", "abc", "12abc", "true", "", "   ", "1000001", "99999999999999999999"})
    void rejectsInvalidStockQuantities(String raw) {
        assertThatThrownBy(() -> QuantityParser.parseStockQuantity(raw, MAX))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void nullIsRejected() {
        assertThatThrownBy(() -> QuantityParser.parseStockQuantity(null, MAX))
                .isInstanceOf(InvalidRequestException.class).hasMessageContaining("required");
    }

    @Test
    void decimalAndNonNumericGetDistinctMessages() {
        assertThatThrownBy(() -> QuantityParser.parseStockQuantity("2.5", MAX)).hasMessageContaining("Decimal");
        assertThatThrownBy(() -> QuantityParser.parseStockQuantity("abc", MAX)).hasMessageContaining("Non-numeric");
    }

    @Test
    void orderQuantityMustBePositive() {
        assertThat(QuantityParser.parseOrderQuantity("1", MAX)).isEqualTo(1);
        assertThatThrownBy(() -> QuantityParser.parseOrderQuantity("0", MAX)).isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> QuantityParser.parseOrderQuantity("-4", MAX)).isInstanceOf(InvalidRequestException.class);
    }
}
