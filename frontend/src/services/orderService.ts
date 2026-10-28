import { apiClient } from './apiClient';
import { mockStore } from './mockStore';
import { Order, CreateOrderPayload } from '../types/order';
import { getConnectionMode } from './productService';

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      try {
        const res = await apiClient.request<Order[] | { content: Order[] }>('/orders');
        return Array.isArray(res) ? res : res.content || [];
      } catch (err: any) {
        // If 404, indicates module not implemented on backend yet
        if (err.statusCode === 404) {
          throw new Error('Orders module is not implemented on the backend yet (HTTP 404).');
        }
        throw err;
      }
    }
    return mockStore.getOrders();
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      return await apiClient.request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    return mockStore.createOrder(payload.productId, payload.requestedQuantity, payload.notes);
  },
};
