export interface DashboardSummary {
  totalProducts: number;
  totalStockUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
}

export interface StockChartPoint {
  productId: string;
  name: string;
  quantity: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}
