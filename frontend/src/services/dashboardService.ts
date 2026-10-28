import { apiClient } from './apiClient';
import { mockStore } from './mockStore';
import { DashboardSummary } from '../types/dashboard';
import { getConnectionMode } from './productService';

export const dashboardService = {
  async getSummary(lowStockThreshold: number = 5): Promise<DashboardSummary> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      try {
        return await apiClient.request<DashboardSummary>(`/dashboard/summary?threshold=${lowStockThreshold}`);
      } catch (err: any) {
        // Fallback: If dashboard summary endpoint is not present, calculate from /products and /orders
        if (err.statusCode === 404 || err.isNetworkError) {
          throw err;
        }
        throw err;
      }
    }
    return mockStore.getSummary(lowStockThreshold);
  },
};
