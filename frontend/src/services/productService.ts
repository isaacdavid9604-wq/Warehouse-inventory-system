import { apiClient } from './apiClient';
import { mockStore } from './mockStore';
import { Product, AddProductPayload, UpdateStockPayload, ProductAvailabilityResult } from '../types/product';
import { ConnectionMode } from '../types/api';

export function getConnectionMode(): ConnectionMode {
  return (localStorage.getItem('wms_connection_mode') as ConnectionMode) || 'demo';
}

export function setConnectionMode(mode: ConnectionMode) {
  localStorage.setItem('wms_connection_mode', mode);
}

export const productService = {
  async getProducts(): Promise<Product[]> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      try {
        const res = await apiClient.request<Product[] | { content: Product[] }>('/products');
        // Handle both direct array and Spring Pageable response
        return Array.isArray(res) ? res : res.content || [];
      } catch (err) {
        console.warn('Backend unavailable, returning mock products', err);
        throw err;
      }
    }
    return mockStore.getProducts();
  },

  async getProductById(productId: string): Promise<Product> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      return await apiClient.request<Product>(`/products/${encodeURIComponent(productId)}`);
    }
    const product = mockStore.getProductById(productId);
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }
    return product;
  },

  async addProduct(payload: AddProductPayload): Promise<Product> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      return await apiClient.request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    return mockStore.addProduct(payload.productId, payload.productName, payload.initialQuantity || 0);
  },

  async updateStock(payload: UpdateStockPayload): Promise<Product> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      // Support PATCH /products/{productId}/stock or PUT fallback
      return await apiClient.request<Product>(`/products/${encodeURIComponent(payload.productId)}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: payload.quantity }),
      });
    }
    return mockStore.updateStock(payload.productId, payload.quantity);
  },

  async checkAvailability(productId: string, quantity: number): Promise<ProductAvailabilityResult> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      return await apiClient.request<ProductAvailabilityResult>(
        `/products/${encodeURIComponent(productId)}/availability?quantity=${quantity}`
      );
    }
    return mockStore.checkAvailability(productId, quantity);
  },
};
