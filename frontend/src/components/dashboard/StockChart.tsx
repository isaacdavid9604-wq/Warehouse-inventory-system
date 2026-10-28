import React from 'react';
import { Product } from '../../types/product';

interface StockChartProps {
  products: Product[];
  threshold: number;
}

export const StockChart: React.FC<StockChartProps> = ({ products, threshold }) => {
  if (products.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400">
        No product data available for visualization
      </div>
    );
  }

  // Find max quantity to scale the bars (minimum 25 for aesthetics)
  const maxQty = Math.max(...products.map(p => p.quantity), threshold * 2, 25);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
        <span>Stock distribution (threshold: {threshold} units)</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" /> In Stock
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Low Stock
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Out of Stock
          </span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {products.map(product => {
          const percentage = Math.min(Math.round((product.quantity / maxQty) * 100), 100);
          const isOut = product.quantity === 0;
          const isLow = product.quantity > 0 && product.quantity < threshold;

          const barColor = isOut
            ? 'bg-rose-500'
            : isLow
            ? 'bg-amber-500'
            : 'bg-blue-600';

          return (
            <div key={product.productId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                    {product.productId}
                  </span>
                  <span className="font-medium text-slate-800">{product.productName}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900">{product.quantity}</span>
                  <span className="text-[11px] text-slate-400">units</span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                {/* Threshold guideline */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10"
                  style={{ left: `${(threshold / maxQty) * 100}%` }}
                  title={`Low Stock Threshold (${threshold})`}
                />
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                  style={{ width: `${Math.max(percentage, isOut ? 2 : 5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
