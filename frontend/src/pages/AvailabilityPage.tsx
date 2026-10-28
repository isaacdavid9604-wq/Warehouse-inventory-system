import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product, ProductAvailabilityResult } from '../types/product';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import { ProductSelect } from '../components/forms/ProductSelect';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { validateStockQuantity } from '../utils/validators';
import { formatNumber } from '../utils/formatters';
import { CheckCircle2, XCircle, Search, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export const AvailabilityPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [requestedQty, setRequestedQty] = useState('10');
  const [error, setError] = useState<string | undefined>();
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ProductAvailabilityResult | null>(null);

  useEffect(() => {
    productService.getProducts()
      .then(items => {
        setProducts(items);
        const queryId = searchParams.get('productId');
        if (queryId) {
          const matched = items.find(p => p.productId.toLowerCase() === queryId.toLowerCase());
          if (matched) {
            setSelectedProduct(matched);
          }
        }
      })
      .catch(err => {
        setBackendError(err?.message || 'Failed to load product list.');
      });
  }, [searchParams]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
    setResult(null);

    if (!selectedProduct) {
      setError('Please select a product to check.');
      return;
    }

    const validation = validateStockQuantity(requestedQty);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const qty = Number(requestedQty);
    if (qty <= 0) {
      setError('Requested quantity must be at least 1 unit.');
      return;
    }

    setError(undefined);
    setIsChecking(true);

    try {
      const res = await productService.checkAvailability(selectedProduct.productId, qty);
      setResult(res);
    } catch (err: any) {
      setBackendError(err?.message || 'Availability check failed.');
    } finally {
      setIsChecking(false);
    }
  };

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
          title="Availability Query Error"
          message={backendError}
        />
      )}

      <Card
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Validate Product Availability</span>
          </div>
        }
        subtitle="Planned Module: Checks if warehouse has sufficient units for immediate order fulfillment."
      >
        <form onSubmit={handleCheck} noValidate className="space-y-5">
          <ProductSelect
            label="Product to Inspect"
            required
            products={products}
            selectedProductId={selectedProduct?.productId || ''}
            onSelect={prod => {
              setSelectedProduct(prod);
              setResult(null);
              setError(undefined);
            }}
            hint={selectedProduct ? `Available on shelf: ${selectedProduct.quantity} units` : undefined}
          />

          <FormInput
            label="Requested Order Quantity"
            id="availability-qty-input"
            required
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 10"
            hint="Positive whole number"
            value={requestedQty}
            onChange={e => {
              setRequestedQty(e.target.value);
              if (error) setError(undefined);
              if (result) setResult(null);
            }}
            error={error}
            disabled={isChecking || !selectedProduct}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isChecking}
              disabled={!selectedProduct}
              leftIcon={<Search className="w-4 h-4" />}
            >
              Check Availability
            </Button>
          </div>
        </form>

        {/* Result Card */}
        {result && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
            <div
              className={`p-5 rounded-xl border ${
                result.isAvailable
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.isAvailable ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-sm">
                    {result.isAvailable
                      ? 'Stock is Sufficient — Ready to Order!'
                      : 'Insufficient Warehouse Stock'}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    {result.isAvailable
                      ? `Warehouse has all ${formatNumber(result.requestedQuantity)} requested units of "${result.productName}" available for fulfillment.`
                      : `Cannot fulfill ${formatNumber(result.requestedQuantity)} units of "${result.productName}". Shortage of ${formatNumber(result.shortage)} unit(s).`}
                  </p>
                </div>
              </div>

              {/* Stat breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">In Stock</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {formatNumber(result.availableQuantity)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Requested</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {formatNumber(result.requestedQuantity)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Outcome</span>
                  <span
                    className={`font-bold font-mono text-xs px-2 py-0.5 rounded-full inline-block ${
                      result.isAvailable
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {result.isAvailable ? 'AVAILABLE' : `-${result.shortage} SHORT`}
                  </span>
                </div>
              </div>
            </div>

            {/* Next action recommendation */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span>Next step:</span>
              {result.isAvailable ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/orders')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Proceed to Create Order
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/stock/update?productId=${result.productId}`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Restock Item
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
