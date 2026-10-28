import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import { ProductSelect } from '../components/forms/ProductSelect';
import { Badge } from '../components/common/Badge';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { validateStockQuantity } from '../utils/validators';
import { formatStockStatus, formatNumber } from '../utils/formatters';
import { RefreshCw, ArrowLeft, RotateCcw, Package } from 'lucide-react';

export const UpdateStockPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lowStockThreshold, triggerRefresh } = useInventory();
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [error, setError] = useState<string | undefined>();
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Load products list and pre-select if URL has ?productId=...
  useEffect(() => {
    setIsLoadingProducts(true);
    productService.getProducts()
      .then(items => {
        setProducts(items);
        const queryId = searchParams.get('productId');
        if (queryId) {
          const matched = items.find(p => p.productId.toLowerCase() === queryId.toLowerCase());
          if (matched) {
            setSelectedProduct(matched);
            setNewQuantity(String(matched.quantity));
          }
        }
      })
      .catch(err => {
        setBackendError(err?.message || 'Failed to load warehouse products list.');
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  }, [searchParams]);

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setNewQuantity(String(prod.quantity));
    setError(undefined);
    setBackendError(null);
  };

  const handlePreset = (delta: number) => {
    const current = Number(newQuantity) || 0;
    const calculated = Math.max(0, current + delta);
    setNewQuantity(String(calculated));
    if (error) setError(undefined);
  };

  const handleReset = () => {
    if (selectedProduct) {
      setNewQuantity(String(selectedProduct.quantity));
    } else {
      setNewQuantity('');
    }
    setError(undefined);
    setBackendError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);

    if (!selectedProduct) {
      setError('Please select a product first.');
      return;
    }

    const validation = validateStockQuantity(newQuantity);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError(undefined);
    setIsSubmitting(true);

    const qty = Number(newQuantity);

    try {
      const updated = await productService.updateStock({
        productId: selectedProduct.productId,
        quantity: qty,
      });

      // Update local state
      setSelectedProduct(updated);
      setProducts(prev =>
        prev.map(p => (p.productId === updated.productId ? updated : p))
      );

      // Trigger global inventory re-fetch across dashboard, products, history
      triggerRefresh();

      success(
        'Stock Updated Successfully!',
        `Stock for "${updated.productName}" (ID: ${updated.productId}) set to ${qty} units.`
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to update stock quantity on server.';
      setBackendError(msg);
      toastError('Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQty = selectedProduct?.quantity ?? 0;
  const targetQty = Number(newQuantity);
  const isTargetValid = !isNaN(targetQty) && newQuantity.trim() !== '';
  const difference = isTargetValid ? targetQty - currentQty : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </button>
      </div>

      {backendError && (
        <ErrorAlert
          title="Stock Update Error"
          message={backendError}
        />
      )}

      <Card
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span>Update Stock Quantity</span>
          </div>
        }
        subtitle="Original Module: StockUpdateModule. Allows zero stock; rejects negative, decimals, and non-numeric values."
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Product selector */}
          <ProductSelect
            label="Select Warehouse Product"
            required
            products={products}
            selectedProductId={selectedProduct?.productId || ''}
            onSelect={handleSelectProduct}
            disabled={isLoadingProducts || isSubmitting}
            hint="Choose an existing item from catalog"
          />

          {/* Current vs New Quantity Comparison Panel */}
          {selectedProduct && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedProduct.productId}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {selectedProduct.productName}
                  </h4>
                </div>
                <Badge status={formatStockStatus(selectedProduct.quantity, lowStockThreshold)} />
              </div>

              {/* Visual difference indicator */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Current Stock</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">
                    {formatNumber(selectedProduct.quantity)}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Net Change</p>
                  <div className="flex items-center gap-1 mt-0.5 font-bold text-sm">
                    {difference > 0 ? (
                      <span className="text-emerald-600">+{difference}</span>
                    ) : difference < 0 ? (
                      <span className="text-rose-600">{difference}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">New Stock</p>
                  <p className="text-xl font-bold text-blue-600 mt-0.5">
                    {isTargetValid && targetQty >= 0 ? formatNumber(targetQty) : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Quantity Input */}
          <div className="space-y-3">
            <FormInput
              label="New Stock Quantity"
              id="new-stock-input"
              required
              placeholder="e.g. 25"
              hint="Whole number ≥ 0 (decimals and negative numbers are rejected)"
              value={newQuantity}
              onChange={e => {
                setNewQuantity(e.target.value);
                if (error) setError(undefined);
              }}
              error={error}
              disabled={isSubmitting || !selectedProduct}
              leftIcon={<Package className="w-4 h-4" />}
            />

            {/* Quick Adjustment Preset Buttons */}
            {selectedProduct && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-xs text-slate-500 mr-1">Quick Adjust:</span>
                <button
                  type="button"
                  onClick={() => handlePreset(1)}
                  disabled={isSubmitting}
                  className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(5)}
                  disabled={isSubmitting}
                  className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(10)}
                  disabled={isSubmitting}
                  className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(-1)}
                  disabled={isSubmitting}
                  className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(-5)}
                  disabled={isSubmitting}
                  className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewQuantity('0');
                    if (error) setError(undefined);
                  }}
                  disabled={isSubmitting}
                  className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                >
                  Set to 0 (Out of stock)
                </button>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleReset}
              disabled={isSubmitting || !selectedProduct}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset Value
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => navigate('/products')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={!selectedProduct}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Confirm Stock Update
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
