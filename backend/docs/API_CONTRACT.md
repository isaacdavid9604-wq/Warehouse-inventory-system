# API Contract

Base URL: `http://localhost:8080/api` · JSON everywhere · timestamps are ISO-8601 UTC (`2026-10-28T09:15:30.123456Z`).
Stock is always a plain **integer**. The stock field in product JSON is named **`quantity`** (that is what the frontend uses).

## Error format (all endpoints)

```json
{
  "timestamp": "2026-10-28T09:15:30.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Quantity must be a whole number. Decimal values are not allowed.",
  "path": "/api/products/P101/stock",
  "details": { "productId": "Product ID is required and cannot be blank or contain only whitespace." }
}
```
`details` appears only for bean-validation failures. The frontend displays `message`.

| Status | Used for |
|---|---|
| 200 | read / update OK |
| 201 | product or order created |
| 400 | invalid input (blank/whitespace, negative, decimal, non-numeric, too large, bad JSON, bad parameter) |
| 404 | product / order / path not found |
| 405 / 415 | wrong method / content type |
| 409 | duplicate product ID, insufficient stock, concurrent-modification conflict |
| 500 | unexpected error (generic message, no stack trace) |

---

## Products

### POST /products  → 201
```json
// request  (initialQuantity optional, whole number >= 0, default 0)
{ "productId": "P104", "productName": "Laptop" }
// response
{ "productId": "P104", "productName": "Laptop", "quantity": 0, "status": "OUT_OF_STOCK",
  "createdAt": "2026-10-28T09:15:30.123456Z", "updatedAt": "2026-10-28T09:15:30.123456Z" }
```
Errors: 400 (missing/blank/whitespace id or name, negative/decimal/non-numeric initialQuantity), 409 `Product with ID "P104" already exists. Product IDs must be unique.` Leading/trailing spaces are trimmed. Max lengths: ID 30, name 100.

### GET /products  → 200
Array of products sorted by `productId`. `?search=key` matches ID or name, case-insensitive substring.
```json
[ { "productId": "P101", "productName": "Keyboard", "quantity": 20, "status": "IN_STOCK", "createdAt": "…", "updatedAt": "…" } ]
```
`status`: `OUT_OF_STOCK` (=0), `LOW_STOCK` (0 < qty < threshold, default 5), `IN_STOCK`.

### GET /products/{productId}  → 200 / 404
Same product object. 404: `Product with ID "X" was not found.`

### PATCH /products/{productId}/stock  → 200
```json
// request
{ "quantity": 25 }
// response (product fields + previousQuantity)
{ "productId": "P101", "productName": "Keyboard", "quantity": 25, "previousQuantity": 20,
  "status": "IN_STOCK", "createdAt": "…", "updatedAt": "…" }
```
`0` is allowed. 400 for: `-1`, `2.5`, `25.0`, `"abc"`, `true`, `null`, missing field, `> 1,000,000`, `> 2147483647`. 404 for unknown product. A history row (`STOCK_UPDATE`) is written on success only.

### GET /products/{productId}/availability?quantity=10  → 200
```json
{ "productId": "P101", "productName": "Keyboard", "availableQuantity": 20, "requestedQuantity": 10,
  "isAvailable": true, "shortage": 0,
  "message": "Sufficient stock: 20 unit(s) available, 10 requested.", "checkedAt": "…" }
```
Insufficient stock is still **200** with `"isAvailable": false`, `"shortage": 30` and an explanatory `message`. 400 for missing/zero/negative/decimal/non-numeric quantity; 404 for unknown product.

---

## Orders

### POST /orders  → 201
```json
// request ("quantity" is accepted as an alias of "requestedQuantity"; notes optional, max 500)
{ "productId": "P101", "requestedQuantity": 5, "notes": "Lab restock" }
// response
{ "orderId": "ORD-000001", "productId": "P101", "productName": "Keyboard", "requestedQuantity": 5,
  "status": "FULFILLED", "createdAt": "…", "notes": "Lab restock",
  "items": [ { "productId": "P101", "productName": "Keyboard", "quantity": 5 } ] }
```
Stock is deducted exactly once, atomically, with a pessimistic row lock. Errors: 400 invalid quantity/productId, 404 unknown product, **409** `Insufficient stock for "Keyboard". Available: 20, requested: 21.` (no order, no stock change, no history).

### GET /orders  → 200
Array, newest first (same shape as above).

### GET /orders/{orderId}  → 200 / 404
`orderId` accepts `ORD-000001`, `ord-1` or `1`.

---

## Stock history

### GET /stock-history?productId=P101&limit=100  → 200
Newest first; `productId` optional filter (case-insensitive); `limit` default 500, max 1000.
```json
[ { "id": "HIST-000007", "productId": "P101", "productName": "Keyboard",
    "previousQuantity": 20, "newQuantity": 15, "quantityChange": -5,
    "operationType": "ORDER_FULFILLMENT", "timestamp": "…", "note": "Order ORD-000001 fulfilled" } ]
```
`operationType`: `INITIAL` (product created with stock > 0, or seed), `STOCK_UPDATE`, `ORDER_FULFILLMENT`.

---

## Dashboard

### GET /dashboard/summary?threshold=5  → 200
`threshold` is optional (whole number ≥ 1); default is `LOW_STOCK_THRESHOLD` (5).
```json
{ "totalProducts": 3, "totalStockUnits": 65, "lowStockProducts": 0, "outOfStockProducts": 0,
  "totalOrders": 0, "lowStockThreshold": 5 }
```
Out of stock = quantity 0 · Low stock = 0 < quantity < threshold · In stock = quantity ≥ threshold.

---

## Health / docs
`GET /actuator/health` (and `/actuator/health/liveness`) · `GET /swagger-ui.html` · `GET /v3/api-docs`

## Differences from the original brief (all driven by the existing frontend)
| Brief | Implemented | Reason |
|---|---|---|
| `stockQuantity` | `quantity` | frontend `Product` type |
| order body `quantity` | `requestedQuantity` (+ `quantity` alias) | frontend `CreateOrderPayload` |
| availability `available` / `stock` names | `isAvailable`, `availableQuantity`, `shortage` | frontend `ProductAvailabilityResult` |
| operation type `ORDER` | `ORDER_FULFILLMENT` | frontend `OperationType` |
| numeric IDs | `ORD-000001`, `HIST-000001` strings | frontend types use string IDs |
| initial stock only 0 | optional `initialQuantity` | frontend `AddProductPayload` |
| fixed threshold | optional `?threshold=` | frontend sends it |
| initial product stock quantity > 0 → history | `INITIAL` entry | matches frontend demo behaviour |

## Known limitations
* Unit/integration tests have not been executed in the authoring environment (see README §8).
* One product per order today; tables (`orders` + `order_items`) already allow several items, the API/DTO accepts one.
* No authentication/authorization, no order cancellation/refund, no product edit/delete endpoints (not requested).
* Product and order lists are not paginated (history is capped at 1000 rows).
* `search` treats `%` and `_` as wildcards.
* Product IDs are matched case-insensitively (`p101` = `P101`).
* Flyway migration is written for MySQL 8; the tests use H2 with Hibernate-generated tables, so the SQL migration itself is only exercised against real MySQL.
