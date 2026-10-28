# Warehouse Inventory Management System – Backend

Spring Boot REST API for the Warehouse Inventory Management System. It keeps the business rules of the original console modules (`AddProductModule.java`, `StockUpdateModule.java`) and adds database persistence plus the two Jira features (**Validate Product Availability**, **Create an Order**), stock history and a dashboard summary.

It is built to match the React/Vite/TypeScript frontend in `SE Project/` without changing it (see `docs/FRONTEND_INTEGRATION.md`).

## Stack and exact requirements

| Tool | Version |
|---|---|
| JDK (not just a JRE) | **21** (any 21.x LTS) |
| Maven | **3.9+** |
| Spring Boot | 3.5.6 (managed by the parent POM) |
| MySQL | **8.0.16+** (8.x recommended; CHECK constraints need 8.0.16+) |
| Node.js (frontend) | 18+ (20+ recommended) |

## Architecture

```
controller  -> thin REST endpoints (/api/**)
service     -> business rules, transactions, locking
repository  -> Spring Data JPA
entity      -> Product, CustomerOrder, OrderItem, StockHistory
dto         -> request/response records (entities are never exposed)
exception   -> GlobalExceptionHandler, one JSON error shape
config      -> CORS, typed properties, optional dev seeder, OpenAPI
```

Schema is owned by **Flyway** (`src/main/resources/db/migration/V1__create_schema.sql`). Hibernate never changes the schema (`ddl-auto=none`).

## 1. Create the MySQL database

```sql
CREATE DATABASE warehouse_inventory CHARACTER SET utf8mb4;
CREATE USER 'warehouse_app'@'localhost' IDENTIFIED BY 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON warehouse_inventory.* TO 'warehouse_app'@'localhost';
FLUSH PRIVILEGES;
```

Tables are created automatically by Flyway on first start.

## 2. Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/warehouse_inventory?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | JDBC URL |
| `DB_USERNAME` | `warehouse_app` | DB user |
| `DB_PASSWORD` | *(empty)* | DB password – **always set it** |
| `PORT` | `8080` | HTTP port (Render sets this itself) |
| `SEED_ENABLED` | `true` | Insert P101/P102/P103 if missing |
| `LOW_STOCK_THRESHOLD` | `5` | Default low-stock threshold |
| `MAX_STOCK_QUANTITY` | `1000000` | Upper bound for any quantity (matches the frontend) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000` | Comma-separated frontend origins |
| `SWAGGER_ENABLED` | `true` | Swagger UI / OpenAPI JSON |
| `DB_POOL_SIZE` | `10` | Connection pool size |

Windows PowerShell:

```powershell
$env:DB_USERNAME = "warehouse_app"
$env:DB_PASSWORD = "choose_a_strong_password"
```

macOS/Linux:

```bash
export DB_USERNAME=warehouse_app
export DB_PASSWORD='choose_a_strong_password'
```

`.env.example` lists every variable. Do not commit real passwords.

## 3. Build, run, test

```bash
mvn clean package          # build + run tests -> target/warehouse-inventory.jar
mvn spring-boot:run        # run in dev
java -jar target/warehouse-inventory.jar
mvn test                   # tests only (in-memory H2, no MySQL needed)
```

### Verify

```bash
curl http://localhost:8080/actuator/health          # {"status":"UP"} when the DB is reachable
curl http://localhost:8080/api/products
```

Swagger UI: <http://localhost:8080/swagger-ui.html> · OpenAPI JSON: <http://localhost:8080/v3/api-docs>

Inspect the database:

```sql
USE warehouse_inventory;
SELECT * FROM products;
SELECT * FROM stock_history ORDER BY id DESC;
SELECT * FROM flyway_schema_history;
```

### Seed data
With `SEED_ENABLED=true` (default) the app inserts P101 Keyboard 20, P102 Mouse 30, P103 Monitor 15 **only if those IDs do not exist**. It never updates or deletes anything, so restarts do not duplicate or reset data. Set `SEED_ENABLED=false` to disable.

### Dev vs production settings
| | Local dev | Production |
|---|---|---|
| `SEED_ENABLED` | `true` | `false` |
| `SWAGGER_ENABLED` | `true` | `false` (or keep, your choice) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | your deployed frontend URL only |
| DB | local MySQL | managed/hosted MySQL with TLS (`useSSL=true`) |
| Schema | Flyway | Flyway (same migrations) – never `ddl-auto=update` |

### Changing database settings
Change `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` and restart. A new empty database is migrated automatically.

## 4. Business rules and concurrency

* IDs and names are trimmed; blank / whitespace-only values → 400. Duplicate IDs (case-insensitive) → 409; the DB primary key is the final guard.
* Quantities must be JSON whole numbers (or whole-number text). Decimals (`2.5`, `25.0`), non-numeric values, values above `MAX_STOCK_QUANTITY` or above the int range → 400. Nothing is rounded.
* Stock update: allows `0`, rejects negatives, 404 for unknown product.
* **Preventing overselling:** `OrderService.createOrder` and `ProductService.updateStock` load the product with `SELECT … FOR UPDATE` (`@Lock(PESSIMISTIC_WRITE)`). A concurrent request for the same product waits for the first transaction to commit, then re-reads the reduced stock and re-checks it. Stock check, deduction, order insert and history insert are one transaction – on failure everything rolls back. Backstops: `@Version` optimistic lock on `Product` and `CHECK (stock_quantity >= 0)` in MySQL.
* History rows are written with `Propagation.MANDATORY`, i.e. only inside the stock-changing transaction, so failures leave no partial history.

## 5. API summary

Base URL `http://localhost:8080/api`. Full request/response examples: **`docs/API_CONTRACT.md`**.

| Method | Path | Success |
|---|---|---|
| POST | `/products` | 201 |
| GET | `/products?search=` | 200 |
| GET | `/products/{productId}` | 200 |
| PATCH | `/products/{productId}/stock` | 200 |
| GET | `/products/{productId}/availability?quantity=` | 200 |
| POST | `/orders` | 201 |
| GET | `/orders`, `/orders/{orderId}` | 200 |
| GET | `/stock-history?productId=&limit=` | 200 |
| GET | `/dashboard/summary?threshold=` | 200 |

## 6. CORS
Allowed origins come from `CORS_ALLOWED_ORIGINS` and apply to `/api/**` (methods GET, POST, PATCH, PUT, DELETE, OPTIONS). Trailing slashes are stripped. For a deployed frontend add its exact origin, e.g. `https://my-wms.onrender.com`.

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `Access denied for user` | Wrong `DB_USERNAME`/`DB_PASSWORD`, or the user lacks privileges on the database |
| `Communications link failure` / `Connection refused` | MySQL not running, wrong host/port in `DB_URL` |
| `Unknown database 'warehouse_inventory'` | Run the `CREATE DATABASE` statement |
| Flyway "Unsupported Database" | Use MySQL 8.x; ensure `flyway-mysql` is on the classpath (it is in `pom.xml`) |
| `Port 8080 was already in use` | Stop the other process or set `PORT=8081` (and update the frontend URL) |
| Browser "blocked by CORS policy" | Add the exact frontend origin to `CORS_ALLOWED_ORIGINS` and restart |
| Frontend still shows demo data | Switch to **Live** in the frontend Settings page |
| Render: first request very slow | Free instances sleep; wait ~1 min and retry |
| `release version 21 not supported` | You are running an older JDK; install JDK 21 |

## 8. Test status (be honest about what ran)

Test classes in `src/test/java`: `ProductApiTest`, `StockUpdateApiTest`, `AvailabilityApiTest`, `OrderApiTest`, `DashboardApiTest`, `QuantityParserTest`, `OrderConcurrencyTest` (20 parallel orders against stock 5 → exactly 5 succeed).

**Not yet executed.** The environment this project was generated in had no Maven and no internet access, so `mvn test` and `mvn package` have **not** been run. What was actually run: the `QuantityParser` rules (decimal / non-numeric / negative / too-large / zero handling) compiled and passed in plain Java. Run `mvn clean verify` on your machine and fix anything it reports before relying on the results.

## 9. Known limitations
See the end of `docs/API_CONTRACT.md`.
