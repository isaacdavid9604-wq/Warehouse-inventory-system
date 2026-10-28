-- Warehouse Inventory Management System - initial schema (MySQL 8)

CREATE TABLE products (
    product_id      VARCHAR(30)  NOT NULL,
    product_name    VARCHAR(100) NOT NULL,
    stock_quantity  INT          NOT NULL DEFAULT 0,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (product_id),
    CONSTRAINT chk_products_stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT chk_products_id_not_blank CHECK (CHAR_LENGTH(TRIM(product_id)) > 0),
    CONSTRAINT chk_products_name_not_blank CHECK (CHAR_LENGTH(TRIM(product_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    status      VARCHAR(20)  NOT NULL,
    notes       VARCHAR(500) NULL,
    created_at  DATETIME(6)  NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    order_id      BIGINT       NOT NULL,
    product_id    VARCHAR(30)  NOT NULL,
    product_name  VARCHAR(100) NOT NULL,
    quantity      INT          NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (product_id),
    CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_order_items_order ON order_items (order_id);

CREATE TABLE stock_history (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    product_id        VARCHAR(30)  NOT NULL,
    product_name      VARCHAR(100) NOT NULL,
    previous_quantity INT          NOT NULL,
    new_quantity      INT          NOT NULL,
    quantity_change   INT          NOT NULL,
    operation_type    VARCHAR(30)  NOT NULL,
    note              VARCHAR(255) NULL,
    created_at        DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_stock_history_product FOREIGN KEY (product_id) REFERENCES products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_stock_history_product ON stock_history (product_id, id);
