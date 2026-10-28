import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../../types/product';
import { ChevronDown, Search, Package, AlertCircle } from 'lucide-react';

interface ProductSelectProps {
  label: string;
  products: Product[];
  selectedProductId: string;
  onSelect: (product: Product) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  label,
  products,
  selectedProductId,
  onSelect,
  error,
  required = false,
  disabled = false,
  hint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(
    p => p.productId.toLowerCase() === selectedProductId.toLowerCase()
  );

  const filteredProducts = products.filter(p =>
    p.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="w-full space-y-1.5 relative">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg border text-sm text-left transition-colors bg-white focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-100'
        }`}
      >
        {selectedProduct ? (
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs">
              {selectedProduct.productId}
            </span>
            <span className="font-medium text-slate-900 truncate">
              {selectedProduct.productName}
            </span>
            <span className="text-xs text-slate-500 ml-auto flex-shrink-0">
              ({selectedProduct.quantity} in stock)
            </span>
          </div>
        ) : (
          <span className="text-slate-400">Select a product...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
      </button>

      {error && (
        <div role="alert" className="flex items-center gap-1.5 text-xs text-rose-600 mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by ID or name..."
                autoFocus
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching products found
              </div>
            ) : (
              filteredProducts.map(product => {
                const isSelected = product.productId === selectedProductId;
                return (
                  <button
                    key={product.productId}
                    type="button"
                    onClick={() => {
                      onSelect(product);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="font-mono font-semibold text-slate-900 mr-2">
                          {product.productId}
                        </span>
                        <span className="text-slate-600">{product.productName}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        product.quantity === 0
                          ? 'bg-rose-100 text-rose-700'
                          : product.quantity < 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {product.quantity} in stock
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
