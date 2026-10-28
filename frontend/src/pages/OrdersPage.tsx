import React, { useState, useEffect, useCallback } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { Order } from '../types/order';
import { Product } from '../types/product';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { ProductSelect } from '../components/forms/ProductSelect';
import { TableSkeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { validateOrderQuantity } from '../utils/validators';
import { formatDate, formatNumber } from '../utils/formatters';
import { ShoppingCart, PlusCircle, RefreshCw, CheckCircle2, PackageCheck } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { refreshTrigger, triggerRefresh } = useInventory();
  const { success, error: toastError } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal for creating order
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [requestedQty, setRequestedQty] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderList, productList] = await Promise.all([
        orderService.getOrders(),
        productService.getProducts(),
      ]);
      setOrders(orderList);
      setProducts(productList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order management records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshTrigger]);

  const handleOpenModal = () => {
    setSelectedProduct(null);
    setRequestedQty('');
    setOrderNotes('');
    setFormError(undefined);
    setIsModalOpen(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setFormError('Please select a product.');
      return;
    }

    const validation = validateOrderQuantity(requestedQty, selectedProduct.quantity);
    if (!validation.isValid) {
      setFormError(validation.error);
      return;
    }

    setFormError(undefined);
    setIsSubmitting(true);

    try {
      // 1. Authoritative backend availability check
      const availability = await productService.checkAvailability(
        selectedProduct.productId,
        Number(requestedQty)
      );

      if (!availability.isAvailable) {
        throw new Error(
          `Insufficient inventory on shelf. Available: ${availability.availableQuantity}, Requested: ${availability.requestedQuantity}. Shortage: ${availability.shortage} units.`
        );
      }

      // 2. Submit order
      const newOrder = await orderService.createOrder({
        productId: selectedProduct.productId,
        requestedQuantity: Number(requestedQty),
        notes: orderNotes.trim() || undefined,
      });

      // Update state and refresh
      setOrders(prev => [newOrder, ...prev]);
      triggerRefresh();
      setIsModalOpen(false);

      success(
        'Order Placed Successfully!',
        `Order ${newOrder.orderId} for ${newOrder.requestedQuantity}x "${newOrder.productName}" fulfilled.`
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to create order.';
      setFormError(msg);
      toastError('Order Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Order Management Module
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Planned Module: Create an Order. Validates product availability and stock allocation before fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Create Order
          </Button>
        </div>
      </div>

      {error && <ErrorAlert title="Order Service Notice" message={error} onRetry={fetchOrders} />}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-8 h-8" />}
            title="No Orders Found"
            description="No customer or warehouse dispatch orders have been placed yet."
            actionText="Create Order"
            onAction={handleOpenModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Product ID</th>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Requested Qty</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600">
                      {order.productId}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {order.productName}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {formatNumber(order.requestedQuantity)} units
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Inventory Order"
        subtitle="Verifies stock availability before reserving and deducting units."
        maxWidth="md"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <ProductSelect
            label="Product to Order"
            required
            products={products}
            selectedProductId={selectedProduct?.productId || ''}
            onSelect={prod => {
              setSelectedProduct(prod);
              setFormError(undefined);
            }}
            hint={selectedProduct ? `Available on shelf: ${selectedProduct.quantity} units` : undefined}
          />

          <FormInput
            label="Requested Quantity"
            id="order-qty-input"
            required
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 5"
            hint="Positive whole number (must not exceed available stock)"
            value={requestedQty}
            onChange={e => {
              setRequestedQty(e.target.value);
              setFormError(undefined);
            }}
            error={formError}
            disabled={isSubmitting || !selectedProduct}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Order Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="e.g. Expedited warehouse shipment..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!selectedProduct}
              leftIcon={<PackageCheck className="w-4 h-4" />}
            >
              Confirm & Allocate Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
