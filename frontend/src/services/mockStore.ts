import { Product, ProductAvailabilityResult } from '../types/product';
import { Order } from '../types/order';
import { StockHistoryItem } from '../types/history';
import { DashboardSummary } from '../types/dashboard';

const STORAGE_KEYS = {
  PRODUCTS: 'wms_products',
  ORDERS: 'wms_orders',
  HISTORY: 'wms_stock_history',
  CONFIG: 'wms_config',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    productId: 'P101',
    productName: 'Keyboard',
    quantity: 20,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    productId: 'P102',
    productName: 'Mouse',
    quantity: 30,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    productId: 'P103',
    productName: 'Monitor',
    quantity: 15,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const INITIAL_HISTORY: StockHistoryItem[] = [
  {
    id: 'HIST-001',
    productId: 'P101',
    productName: 'Keyboard',
    previousQuantity: 0,
    newQuantity: 20,
    quantityChange: 20,
    operationType: 'INITIAL',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    note: 'Initial inventory intake',
  },
  {
    id: 'HIST-002',
    productId: 'P102',
    productName: 'Mouse',
    previousQuantity: 0,
    newQuantity: 30,
    quantityChange: 30,
    operationType: 'INITIAL',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    note: 'Initial inventory intake',
  },
  {
    id: 'HIST-003',
    productId: 'P103',
    productName: 'Monitor',
    previousQuantity: 0,
    newQuantity: 15,
    quantityChange: 15,
    operationType: 'INITIAL',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    note: 'Initial inventory intake',
  },
];

class MockStore {
  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    this.setStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.setStorage(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    this.setStorage(STORAGE_KEYS.ORDERS, []);
  }

  public getProducts(): Product[] {
    this.init();
    return this.getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  public getProductById(id: string): Product | undefined {
    const products = this.getProducts();
    return products.find(p => p.productId.toLowerCase() === id.trim().toLowerCase());
  }

  public addProduct(productId: string, productName: string, initialQuantity: number = 0): Product {
    const products = this.getProducts();
    const cleanId = productId.trim();
    const cleanName = productName.trim();

    if (products.some(p => p.productId.toLowerCase() === cleanId.toLowerCase())) {
      throw new Error(`Product with ID "${cleanId}" already exists.`);
    }

    const newProduct: Product = {
      productId: cleanId,
      productName: cleanName,
      quantity: initialQuantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);
    this.setStorage(STORAGE_KEYS.PRODUCTS, products);

    // Record history
    this.addHistory({
      id: `HIST-${Date.now().toString().slice(-4)}`,
      productId: cleanId,
      productName: cleanName,
      previousQuantity: 0,
      newQuantity: initialQuantity,
      quantityChange: initialQuantity,
      operationType: 'INITIAL',
      timestamp: new Date().toISOString(),
      note: 'Product created',
    });

    return newProduct;
  }

  public updateStock(productId: string, newQuantity: number): Product {
    const products = this.getProducts();
    const index = products.findIndex(p => p.productId.toLowerCase() === productId.trim().toLowerCase());

    if (index === -1) {
      throw new Error(`Product with ID "${productId}" does not exist.`);
    }

    const prevProduct = products[index];
    const previousQuantity = prevProduct.quantity;
    const change = newQuantity - previousQuantity;

    const updatedProduct: Product = {
      ...prevProduct,
      quantity: newQuantity,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updatedProduct;
    this.setStorage(STORAGE_KEYS.PRODUCTS, products);

    // Record history
    this.addHistory({
      id: `HIST-${Date.now().toString().slice(-4)}`,
      productId: updatedProduct.productId,
      productName: updatedProduct.productName,
      previousQuantity,
      newQuantity,
      quantityChange: change,
      operationType: 'STOCK_UPDATE',
      timestamp: new Date().toISOString(),
      note: `Stock updated manually from ${previousQuantity} to ${newQuantity}`,
    });

    return updatedProduct;
  }

  public checkAvailability(productId: string, requestedQuantity: number): ProductAvailabilityResult {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    const isAvailable = product.quantity >= requestedQuantity;
    const shortage = isAvailable ? 0 : requestedQuantity - product.quantity;

    return {
      productId: product.productId,
      productName: product.productName,
      availableQuantity: product.quantity,
      requestedQuantity,
      isAvailable,
      shortage,
      checkedAt: new Date().toISOString(),
    };
  }

  public getOrders(): Order[] {
    return this.getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  }

  public createOrder(productId: string, requestedQuantity: number, notes?: string): Order {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error(`Product with ID "${productId}" does not exist.`);
    }

    if (requestedQuantity <= 0) {
      throw new Error('Order quantity must be a positive whole number.');
    }

    if (product.quantity < requestedQuantity) {
      throw new Error(`Insufficient stock for "${product.productName}". Available: ${product.quantity}, requested: ${requestedQuantity}.`);
    }

    // Deduct stock
    const newStock = product.quantity - requestedQuantity;
    this.updateStock(product.productId, newStock);

    const newOrder: Order = {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      productId: product.productId,
      productName: product.productName,
      requestedQuantity,
      status: 'FULFILLED',
      createdAt: new Date().toISOString(),
      notes,
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.setStorage(STORAGE_KEYS.ORDERS, orders);

    return newOrder;
  }

  public getHistory(): StockHistoryItem[] {
    return this.getStorage<StockHistoryItem[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
  }

  private addHistory(item: StockHistoryItem) {
    const history = this.getHistory();
    history.unshift(item);
    this.setStorage(STORAGE_KEYS.HISTORY, history.slice(0, 100)); // retain latest 100
  }

  public getSummary(lowStockThreshold: number = 5): DashboardSummary {
    const products = this.getProducts();
    const orders = this.getOrders();

    const totalProducts = products.length;
    const totalStockUnits = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
    const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity < lowStockThreshold).length;
    const outOfStockProducts = products.filter(p => p.quantity === 0).length;
    const totalOrders = orders.length;

    return {
      totalProducts,
      totalStockUnits,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
    };
  }
}

export const mockStore = new MockStore();
