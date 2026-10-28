import { StockStatus } from '../types/product';

export function formatStockStatus(quantity: number, lowStockThreshold: number = 5): StockStatus {
  if (quantity === 0) return 'OUT_OF_STOCK';
  if (quantity < lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export function getStatusBadgeConfig(status: StockStatus) {
  switch (status) {
    case 'IN_STOCK':
      return {
        label: 'In Stock',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
        dotClass: 'bg-emerald-500',
      };
    case 'LOW_STOCK':
      return {
        label: 'Low Stock',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
        dotClass: 'bg-amber-500',
      };
    case 'OUT_OF_STOCK':
      return {
        label: 'Out of Stock',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
        dotClass: 'bg-rose-500',
      };
  }
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
