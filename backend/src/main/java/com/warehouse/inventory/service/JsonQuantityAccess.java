package com.warehouse.inventory.service;

import com.fasterxml.jackson.databind.JsonNode;

/** Turns a JSON value into the raw text that QuantityParser validates. */
public final class JsonQuantityAccess {

    private JsonQuantityAccess() {
    }

    /** Returns null when the value is absent or JSON null. */
    public static String rawText(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return null;
        }
        if (node.isNumber() || node.isTextual()) {
            return node.asText();
        }
        // booleans, arrays, objects -> text that can never parse as a number
        return node.toString();
    }
}
