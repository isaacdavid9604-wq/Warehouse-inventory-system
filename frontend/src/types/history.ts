export type OperationType = 'INITIAL' | 'RESTOCK' | 'ADJUSTMENT' | 'ORDER_FULFILLMENT' | 'STOCK_UPDATE';

export interface StockHistoryItem {
  id: string;
  productId: string;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  quantityChange: number;
  operationType: OperationType;
  timestamp: string;
  note?: string;
}
