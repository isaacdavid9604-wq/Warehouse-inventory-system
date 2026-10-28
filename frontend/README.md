# Warehouse Inventory Management System - Frontend

A professional, responsive, production-ready frontend for the **Warehouse Inventory Management System**, built with React, Vite, TypeScript, and Tailwind CSS.

This application brings together the original standalone Java console modules (`AddProductModule.java` and `StockUpdateModule.java`) and the planned Jira modules (`Create an Order` and `Validate Product Availability`) into a cohesive warehouse SaaS management application.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (Node.js v20+ recommended)
- **npm**: v9.0.0 or later

### 2. Installation
Open your terminal in this directory (`c:/Users/ISAAC/OneDrive/Desktop/SE Project`) and run:

```bash
npm install
```

### 3. Start Development Server
Launch the local Vite server:

```bash
npm run dev
```

The application will be live at:
**[http://localhost:3000](http://localhost:3000)** (or the designated port shown in terminal).

### 4. Build for Production
To create an optimized production build:

```bash
npm run build
```

---

## 🌐 Backend API Integration

The frontend connects to a Spring Boot REST backend configured via `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_DEFAULT_LOW_STOCK_THRESHOLD=5
VITE_WAREHOUSE_NAME=Main Distribution Hub - Bay A
```

### Automatic Fallback & Interactive Demo Mode
To ensure immediate testability before and alongside the Spring Boot backend:
- **Live Backend Mode**: When connected, all requests are routed to `http://localhost:8080/api`.
- **Interactive Demo Mode**: When the backend is offline or for local verification, the application operates with interactive `localStorage` persistence, populated with initial seed data:
  - `P101`: Keyboard (Initial Stock: 20)
  - `P102`: Mouse (Initial Stock: 30)
  - `P103`: Monitor (Initial Stock: 15)
- You can test connectivity or toggle modes at any time in **Settings**.

### Authoritative API Route Reference

| Method | Endpoint | Module / Purpose |
|---|---|---|
| `GET` | `/products` | List all inventory items |
| `GET` | `/products/{productId}` | Fetch individual product record |
| `POST` | `/products` | Add new product (`AddProductModule`) |
| `PATCH` | `/products/{productId}/stock` | Update stock quantity (`StockUpdateModule`) |
| `GET` | `/dashboard/summary?threshold=5` | Inventory summary KPIs |
| `GET` | `/orders` | List customer orders |
| `POST` | `/orders` | Create order (`Create an Order`) |
| `GET` | `/products/{productId}/availability?quantity=10` | Check product availability (`Availability Module`) |
| `GET` | `/stock-history` | Transaction audit log |

---

## 📦 Implemented Modules & Features

### 1. Dashboard (`/`)
- Summary KPI Cards: Total Products, Total Stock Units, Low-Stock Products, Out-of-Stock Products, Total Orders.
- Stock Overview distribution chart comparing product levels against the safety threshold.
- Real-time Low-Stock alert table with one-click "Restock" action.
- Recent products and recent orders activity feeds.

### 2. Products Catalog (`/products`)
- Search by Product ID (e.g. `P101`) or Product Name.
- Status filters: All, In Stock, Low Stock, Out of Stock.
- Sortable table columns (Product ID, Name, Quantity, Status).
- Dynamic stock status pills based on configurable threshold:
  - **In Stock** (Green): Quantity $\ge$ threshold
  - **Low Stock** (Amber): $0 <$ Quantity $<$ threshold
  - **Out of Stock** (Red): Quantity $= 0$
- Pagination controls with configurable page size (5, 10, 25, 50).
- Product Details Modal showing complete metadata, storage location, and quick actions.

### 3. Add Product (`/products/add`)
- Corresponds to `AddProductModule.java`.
- Validations:
  - Product ID is required, trimmed of leading/trailing whitespace.
  - Product Name is required, trimmed of whitespace.
  - Rejects blank or whitespace-only inputs.
  - Uniqueness validation: Rejects duplicate Product IDs with clear error message.
  - Disables submit during request to prevent double submissions.
  - Accessible error indicators and success banner with link to view product.

### 4. Update Stock Quantity (`/stock/update`)
- Corresponds to `StockUpdateModule.java`.
- Searchable product selector dropdown showing current stock.
- Live comparison panel showing Current Stock, Net Change ($\pm$), and New Stock.
- Quick adjust presets: `+1`, `+5`, `+10`, `-1`, `-5`, and `Set to 0 (Out of stock)`.
- Validations:
  - Product must exist.
  - Quantity must be a whole non-negative integer ($\ge 0$).
  - Zero stock is explicitly allowed.
  - Rejects negative values (e.g. `-5`).
  - Rejects decimal values (e.g. `2.5`).
  - Rejects non-numeric characters.
  - Rejects quantities exceeding $1,000,000$ units.

### 5. Orders Management (`/orders`)
- Corresponds to planned Jira module `Create an Order`.
- Create Order dialog with live product availability validation.
- Validates quantity is a positive whole number ($\ge 1$) and does not exceed available shelf stock.
- Automatically adjusts product stock and generates audit log upon fulfillment.
- Order history table with order ID, quantity, date, and status.

### 6. Product Availability (`/availability`)
- Corresponds to planned Jira module `Validate Product Availability`.
- Dedicated checker for testing order feasibility for arbitrary quantities.
- Visual breakdown: In Stock vs Requested Quantity vs Shortage calculation.
- Direct quick links to either "Proceed to Create Order" or "Restock Item".

### 7. Stock Audit History (`/history`)
- Complete transaction log showing Log ID, Product ID, Name, Previous Quantity, New Quantity, Net Change, Operation Type (`INITIAL`, `STOCK_UPDATE`, `RESTOCK`, `ORDER_FULFILLMENT`), and Timestamps.
- Filter by operation type and search by product.

### 8. Settings (`/settings`)
- Configurable Low-Stock Threshold (default: 5 units).
- Live backend connection tester with status response.
- Toggle between Live Backend and Interactive Demo Mode.
- One-click Seed Data Reset (restores P101, P102, P103).

---

## 🧪 Verification Test Cases

| Test Case | Steps | Expected Outcome |
|---|---|---|
| **Add Valid Product** | Go to Add Product, enter `P104`, `Laptop`, initial qty `10`. Submit. | Product added, success toast shown, appears in catalog. |
| **Reject Duplicate ID** | Enter `P101`, `Duplicate Test`. Submit. | Inline error: "Product ID P101 already exists". Submission blocked. |
| **Reject Whitespace** | Enter `"   "`, `"   "`. Submit. | Inline error: "Product ID cannot be blank or contain only whitespace". |
| **Update Stock Valid** | Select `P101`, set stock to `25`. Submit. | Stock updated to 25, net change $+5$ recorded in history. |
| **Allow Zero Stock** | Select `P102`, set stock to `0`. Submit. | Stock updated to 0, status transitions to "Out of Stock". |
| **Reject Negative Stock** | Select `P103`, enter `-5`. Submit. | Rejected: "Quantity cannot be negative". |
| **Reject Decimal Stock** | Select `P103`, enter `2.5`. Submit. | Rejected: "Decimal quantities are not allowed". |
| **Reject Non-numeric** | Enter `"abc"`. Submit. | Rejected: "Enter a valid whole number". |
| **Availability Sufficient** | Select `P103` (qty 15), test requested qty `10`. | Green "AVAILABLE" status card shown. |
| **Availability Shortage** | Select `P103` (qty 15), test requested qty `20`. | Red "INSUFFICIENT" status shown with shortage calculation ($-5$). |
