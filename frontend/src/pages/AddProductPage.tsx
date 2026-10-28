import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { validateProductId, validateProductName, validateStockQuantity } from '../utils/validators';
import { PlusCircle, RotateCcw, ArrowLeft, CheckCircle2, PackagePlus, Eye } from 'lucide-react';

export const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { triggerRefresh } = useInventory();
  const { success, error: toastError } = useToast();

  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('0');

  // Existing products to pre-validate uniqueness client-side as well
  const [existingIds, setExistingIds] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{
    productId?: string;
    productName?: string;
    initialQuantity?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [lastCreatedProduct, setLastCreatedProduct] = useState<Product | null>(null);

  useEffect(() => {
    productService.getProducts().then(products => {
      setExistingIds(products.map(p => p.productId));
    }).catch(err => {
      console.warn('Could not prefetch existing IDs:', err);
    });
  }, []);

  const handleReset = () => {
    setProductId('');
    setProductName('');
    setInitialQuantity('0');
    setErrors({});
    setBackendError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);

    // 1. Validate trimmed inputs
    const trimmedId = productId.trim();
    const trimmedName = productName.trim();

    const idCheck = validateProductId(trimmedId, existingIds);
    const nameCheck = validateProductName(trimmedName);
    const qtyCheck = validateStockQuantity(initialQuantity);

    const newErrors: typeof errors = {};
    if (!idCheck.isValid) newErrors.productId = idCheck.error;
    if (!nameCheck.isValid) newErrors.productName = nameCheck.error;
    if (!qtyCheck.isValid) newErrors.initialQuantity = qtyCheck.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const created = await productService.addProduct({
        productId: trimmedId,
        productName: trimmedName,
        initialQuantity: Number(initialQuantity),
      });

      // Update existing IDs cache
      setExistingIds(prev => [...prev, created.productId]);
      setLastCreatedProduct(created);

      // Trigger global inventory updates
      triggerRefresh();

      success(
        'Product Added Successfully!',
        `"${created.productName}" (ID: ${created.productId}) is now registered in warehouse inventory.`
      );

      // Clear the form
      setProductId('');
      setProductName('');
      setInitialQuantity('0');
    } catch (err: any) {
      const msg = err?.message || 'Failed to add product. Please check input values.';
      setBackendError(msg);
      toastError('Submission Rejected', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Navigation Breadcrumb Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </button>
      </div>

      {/* Success Notification Banner for newly created product */}
      {lastCreatedProduct && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Product "{lastCreatedProduct.productName}" was created successfully!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Reference ID: <span className="font-mono font-bold">{lastCreatedProduct.productId}</span> | Initial Stock: {lastCreatedProduct.quantity} units
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline flex-shrink-0"
          >
            View in Catalog <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {backendError && (
        <ErrorAlert
          title="Product Registration Error"
          message={backendError}
        />
      )}

      <Card
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <span>Register New Product</span>
          </div>
        }
        subtitle="Original Module: AddProductModule. Enforces uniqueness and trims whitespace."
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Product ID input */}
          <FormInput
            label="Product ID"
            id="product-id-input"
            required
            placeholder="e.g. P104"
            hint="Unique identifier (e.g. P101, P102)"
            value={productId}
            onChange={e => {
              setProductId(e.target.value);
              if (errors.productId) {
                setErrors(prev => ({ ...prev, productId: undefined }));
              }
            }}
            error={errors.productId}
            disabled={isSubmitting}
            autoFocus
          />

          {/* Product Name input */}
          <FormInput
            label="Product Name"
            id="product-name-input"
            required
            placeholder="e.g. Mechanical Keyboard"
            hint="Full descriptive product title"
            value={productName}
            onChange={e => {
              setProductName(e.target.value);
              if (errors.productName) {
                setErrors(prev => ({ ...prev, productName: undefined }));
              }
            }}
            error={errors.productName}
            disabled={isSubmitting}
          />

          {/* Initial Stock Quantity */}
          <FormInput
            label="Initial Stock Quantity"
            id="product-qty-input"
            required
            type="number"
            min="0"
            step="1"
            placeholder="0"
            hint="Whole number ≥ 0 (can start at 0)"
            value={initialQuantity}
            onChange={e => {
              setInitialQuantity(e.target.value);
              if (errors.initialQuantity) {
                setErrors(prev => ({ ...prev, initialQuantity: undefined }));
              }
            }}
            error={errors.initialQuantity}
            disabled={isSubmitting}
          />

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleReset}
              disabled={isSubmitting || (!productId && !productName && initialQuantity === '0')}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset Form
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
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Register Product
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
