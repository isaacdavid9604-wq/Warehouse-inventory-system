import { apiClient } from './apiClient';
import { mockStore } from './mockStore';
import { StockHistoryItem } from '../types/history';
import { getConnectionMode } from './productService';

export const historyService = {
  async getStockHistory(): Promise<StockHistoryItem[]> {
    const mode = getConnectionMode();
    if (mode === 'live') {
      try {
        const res = await apiClient.request<StockHistoryItem[] | { content: StockHistoryItem[] }>('/stock-history');
        return Array.isArray(res) ? res : res.content || [];
      } catch (err: any) {
        if (err.statusCode === 404) {
          throw new Error('Stock history endpoint is not supported on the backend yet (HTTP 404).');
        }
        throw err;
      }
    }
    return mockStore.getHistory();
  },
};
