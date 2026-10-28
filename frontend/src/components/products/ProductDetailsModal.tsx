import React from 'react';
import { Product } from '../../types/product';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatStockStatus, formatDate, formatNumber } from '../../utils/formatters';
import { Package, Calendar, Clock, RefreshCw, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  threshold: number;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  threshold,
}) => {
  const navigate = useNavigate();

  if (!product) return null;

  const status = formatStockStatus(product.quantity, threshold);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details"
      subtitle={`Warehouse Item Reference #${product.productId}`}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} size="sm">
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              navigate(`/availability?productId=${product.productId}`);
            }}
          >
            Check Availability
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              navigate(`/stock/update?productId=${product.productId}`);
            }}
          >
            Update Stock
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Header Hero */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {product.productId}
              </span>
              <Badge status={status} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 truncate mt-1">
              {product.productName}
            </h4>
          </div>
        </div>

        {/* Stock Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Stock</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatNumber(product.quantity)} <span className="text-xs font-normal text-slate-500">units</span>
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Warning Level</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              &lt; {threshold} <span className="text-xs font-normal text-slate-500">units</span>
            </p>
          </div>
        </div>

        {/* Metadata info */}
        <div className="divide-y divide-slate-100 text-xs text-slate-600">
          <div className="py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" /> Date Registered
            </span>
            <span className="font-medium text-slate-900">
              {formatDate(product.createdAt)}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4 text-slate-400" /> Last Modified
            </span>
            <span className="font-medium text-slate-900">
              {formatDate(product.updatedAt || product.createdAt)}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-slate-400" /> Storage Location
            </span>
            <span className="font-medium text-slate-900">
              Zone B, Shelf {product.productId.slice(-2) || '01'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
