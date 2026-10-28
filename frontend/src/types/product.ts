export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  productId: string;
  productName: string;
  quantity: number;
  status?: StockStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddProductPayload {
  productId: string;
  productName: string;
  initialQuantity?: number;
}

export interface UpdateStockPayload {
  productId: string;
  quantity: number;
}

export interface ProductAvailabilityResult {
  productId: string;
  productName: string;
  availableQuantity: number;
  requestedQuantity: number;
  isAvailable: boolean;
  shortage: number;
  checkedAt: string;
}
