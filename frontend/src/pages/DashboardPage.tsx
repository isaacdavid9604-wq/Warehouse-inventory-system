import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { dashboardService } from '../services/dashboardService';
import { Product } from '../types/product';
import { Order } from '../types/order';
import { DashboardSummary } from '../types/dashboard';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StockChart } from '../components/dashboard/StockChart';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { MetricSkeleton, TableSkeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { formatStockStatus, formatNumber, formatDate } from '../utils/formatters';
import {
  Boxes,
  Package,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { lowStockThreshold, refreshTrigger } = useInventory();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch products first
      const productList = await productService.getProducts();
      setProducts(productList);

      // Attempt to fetch orders (empty state handled gracefully if not supported)
      let orderList: Order[] = [];
      try {
        orderList = await orderService.getOrders();
        setOrders(orderList);
      } catch (err: any) {
        console.warn('Orders unavailable:', err);
        setOrders([]);
      }

      // Attempt summary from backend or derive from live data
      try {
        const sum = await dashboardService.getSummary(lowStockThreshold);
        setSummary(sum);
      } catch {
        // Derive locally
        const totalStockUnits = productList.reduce((acc, p) => acc + (p.quantity || 0), 0);
        const lowStock = productList.filter(p => p.quantity > 0 && p.quantity < lowStockThreshold).length;
        const outStock = productList.filter(p => p.quantity === 0).length;
        setSummary({
          totalProducts: productList.length,
          totalStockUnits,
          lowStockProducts: lowStock,
          outOfStockProducts: outStock,
          totalOrders: orderList.length,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard inventory data.');
    } finally {
      setLoading(false);
    }
  }, [lowStockThreshold]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const lowStockItems = products.filter(
    p => p.quantity > 0 && p.quantity < lowStockThreshold
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory Operations Overview
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock monitoring, critical low-stock alerts, and fast warehouse workflows.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/stock/update')}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Update Stock
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/products/add')}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchData} />}

      {/* KPI Metric Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Products"
            value={formatNumber(summary.totalProducts)}
            subtitle="Catalog items registered"
            icon={<Boxes className="w-5 h-5" />}
            variant="blue"
          />
          <MetricCard
            title="Total Stock Units"
            value={formatNumber(summary.totalStockUnits)}
            subtitle="Warehouse units on hand"
            icon={<Package className="w-5 h-5" />}
            variant="emerald"
            badge={{ text: 'Active Inventory', variant: 'positive' }}
          />
          <MetricCard
            title="Low-Stock Alerts"
            value={formatNumber(summary.lowStockProducts)}
            subtitle={`Below ${lowStockThreshold} units`}
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="amber"
            badge={{
              text: summary.lowStockProducts > 0 ? 'Action Needed' : 'Nominal',
              variant: summary.lowStockProducts > 0 ? 'warning' : 'neutral',
            }}
          />
          <MetricCard
            title="Out-of-Stock"
            value={formatNumber(summary.outOfStockProducts)}
            subtitle="Zero quantity on shelf"
            icon={<XCircle className="w-5 h-5" />}
            variant="rose"
            badge={{
              text: summary.outOfStockProducts > 0 ? 'Critical' : 'None',
              variant: summary.outOfStockProducts > 0 ? 'negative' : 'neutral',
            }}
          />
          <MetricCard
            title="Total Orders"
            value={formatNumber(summary.totalOrders)}
            subtitle="Orders recorded"
            icon={<ShoppingCart className="w-5 h-5" />}
            variant="slate"
          />
        </div>
      ) : null}

      {/* Visual Chart and Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Distribution Chart */}
        <div className="lg:col-span-2">
          <Card
            title={
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Stock Overview by Product</span>
              </div>
            }
            subtitle="Visual volume compared against the low-stock safety threshold"
            action={
              <Link to="/products" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading ? (
              <TableSkeleton rows={4} cols={2} />
            ) : products.length === 0 ? (
              <EmptyState
                title="No Products Found"
                description="Add your first warehouse item to generate inventory charts."
                actionText="Add Product"
                onAction={() => navigate('/products/add')}
              />
            ) : (
              <StockChart products={products} threshold={lowStockThreshold} />
            )}
          </Card>
        </div>

        {/* Low-Stock Attention Card */}
        <div>
          <Card
            title={
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low-Stock Warnings</span>
              </div>
            }
            subtitle={`Items with less than ${lowStockThreshold} units`}
          >
            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                  ✓
                </div>
                All stocked products meet or exceed the safety threshold ({lowStockThreshold} units).
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockItems.map(item => (
                  <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-900 truncate">
                        {item.productName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        {item.productId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono font-bold text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {item.quantity} left
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs py-1 px-2 h-7"
                        onClick={() => navigate(`/stock/update?productId=${item.productId}`)}
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Activity: Products Table & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Warehouse Products"
            subtitle="Latest additions to the inventory master list"
            action={
              <Link to="/products" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading ? (
              <TableSkeleton rows={3} cols={4} />
            ) : products.length === 0 ? (
              <EmptyState
                title="Catalog is Empty"
                description="No products exist in the warehouse database."
                actionText="Add Product"
                onAction={() => navigate('/products/add')}
              />
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-y border-slate-100 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-2.5">Product ID</th>
                      <th className="px-6 py-2.5">Name</th>
                      <th className="px-6 py-2.5">Stock</th>
                      <th className="px-6 py-2.5">Status</th>
                      <th className="px-6 py-2.5 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.slice(0, 5).map(prod => {
                      const status = formatStockStatus(prod.quantity, lowStockThreshold);
                      return (
                        <tr key={prod.productId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-3 font-mono font-medium text-slate-900">
                            {prod.productId}
                          </td>
                          <td className="px-6 py-3 font-semibold text-slate-800">
                            {prod.productName}
                          </td>
                          <td className="px-6 py-3 font-mono font-bold text-slate-900">
                            {formatNumber(prod.quantity)}
                          </td>
                          <td className="px-6 py-3">
                            <Badge status={status} />
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => navigate(`/stock/update?productId=${prod.productId}`)}
                              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
                            >
                              Update <RefreshCw className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Orders Activity */}
        <div>
          <Card
            title="Recent Orders"
            subtitle="Customer orders processed through inventory"
            action={
              <Link to="/orders" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No orders have been recorded yet.
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/orders')}
                  >
                    Create First Order
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 5).map(order => (
                  <div key={order.orderId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono font-semibold text-slate-900">
                        {order.orderId}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {order.productName} ({order.requestedQuantity} units)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
