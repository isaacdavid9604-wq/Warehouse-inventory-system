export type OrderStatus = 'PENDING' | 'FULFILLED' | 'REJECTED' | 'CANCELLED';

export interface Order {
  orderId: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

export interface CreateOrderPayload {
  productId: string;
  requestedQuantity: number;
  notes?: string;
}
