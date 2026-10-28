package com.warehouse.inventory.service;

import com.warehouse.inventory.exception.InvalidRequestException;
import java.math.BigInteger;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Strict whole-number parsing. Decimals are rejected (never rounded), non-numeric text is rejected,
 * and values outside the supported range are rejected.
 */
public final class QuantityParser {

    private static final Pattern WHOLE = Pattern.compile("^[+-]?\\d+$");
    private static final Pattern DECIMAL =
            Pattern.compile("^[+-]?(\\d+\\.\\d*|\\.\\d+|\\d+(\\.\\d+)?[eE][+-]?\\d+)$");

    private QuantityParser() {
    }

    /** Stock level: whole number, zero allowed, no negatives, at most maxAllowed. */
    public static int parseStockQuantity(String raw, int maxAllowed) {
        BigInteger value = parseWholeNumber(raw);
        if (value.signum() < 0) {
            throw new InvalidRequestException("Quantity cannot be negative. Stock must be zero or greater.");
        }
        return checkMax(value, maxAllowed);
    }

    /** Order / availability quantity: positive whole number, at most maxAllowed. */
    public static int parseOrderQuantity(String raw, int maxAllowed) {
        BigInteger value = parseWholeNumber(raw);
        if (value.signum() <= 0) {
            throw new InvalidRequestException("Quantity must be a positive whole number (at least 1).");
        }
        return checkMax(value, maxAllowed);
    }

    private static BigInteger parseWholeNumber(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            throw new InvalidRequestException("Quantity is required.");
        }
        String text = raw.trim();
        if (WHOLE.matcher(text).matches()) {
            return new BigInteger(text);
        }
        if (DECIMAL.matcher(text).matches()) {
            throw new InvalidRequestException("Quantity must be a whole number. Decimal values are not allowed.");
        }
        throw new InvalidRequestException("Quantity must be a whole number. Non-numeric values are not allowed.");
    }

    private static int checkMax(BigInteger value, int maxAllowed) {
        if (value.compareTo(BigInteger.valueOf(maxAllowed)) > 0) {
            throw new InvalidRequestException(String.format(Locale.ROOT,
                    "Quantity exceeds the maximum allowed limit (%,d units).", maxAllowed));
        }
        return value.intValueExact();
    }
}
