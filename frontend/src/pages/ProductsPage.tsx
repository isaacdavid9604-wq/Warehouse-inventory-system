import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { TableSkeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { formatStockStatus, formatDate, formatNumber } from '../utils/formatters';
import {
  PlusCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type SortField = 'productId' | 'productName' | 'quantity' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { lowStockThreshold, refreshTrigger } = useInventory();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('productId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Inspection modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch warehouse products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshTrigger]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        p.productId.toLowerCase().includes(query) ||
        p.productName.toLowerCase().includes(query);

      const status = formatStockStatus(p.quantity, lowStockThreshold);
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter, lowStockThreshold]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'status') {
        valA = formatStockStatus(a.quantity, lowStockThreshold);
        valB = formatStockStatus(b.quantity, lowStockThreshold);
      }

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      if (typeof valA === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [filteredProducts, sortField, sortOrder, lowStockThreshold]);

  // Paginated slice
  const totalPages = Math.ceil(sortedProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Warehouse Product Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, inspect, and manage stock quantities across all registered inventory.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
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

      {error && <ErrorAlert message={error} onRetry={fetchProducts} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Product ID (e.g. P101) or name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0 mr-1" />
          {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map(filter => {
            const labels = {
              ALL: 'All Products',
              IN_STOCK: 'In Stock',
              LOW_STOCK: 'Low Stock',
              OUT_OF_STOCK: 'Out of Stock',
            };
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => {
                  setStatusFilter(filter);
                  setCurrentPage(1);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : sortedProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title={searchQuery || statusFilter !== 'ALL' ? 'No Matching Products' : 'Product Inventory is Empty'}
            description={
              searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or clearing active filters.'
                : 'Get started by adding your first product to the warehouse catalog.'
            }
            actionText={searchQuery || statusFilter !== 'ALL' ? 'Clear Filters' : 'Add First Product'}
            onAction={() => {
              if (searchQuery || statusFilter !== 'ALL') {
                setSearchQuery('');
                setStatusFilter('ALL');
              } else {
                navigate('/products/add');
              }
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th
                      className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 select-none"
                      onClick={() => handleSort('productId')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Product ID</span>
                        {sortField === 'productId' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 select-none"
                      onClick={() => handleSort('productName')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Product Name</span>
                        {sortField === 'productName' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 select-none"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Stock Quantity</span>
                        {sortField === 'quantity' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Stock Status</span>
                        {sortField === 'status' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3.5">Registered</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.map(product => {
                    const status = formatStockStatus(product.quantity, lowStockThreshold);
                    return (
                      <tr
                        key={product.productId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-mono font-semibold text-slate-900">
                          {product.productId}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {product.productName}
                        </td>
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                          {formatNumber(product.quantity)}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge status={status} />
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {formatDate(product.createdAt)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View Product Details"
                              aria-label={`View details for ${product.productName}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/stock/update?productId=${product.productId}`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Update Stock"
                              aria-label={`Update stock for ${product.productName}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-slate-300 py-1 px-2 text-xs bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>of {sortedProducts.length} entries</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-2 py-1 h-8"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <span className="px-2 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-2 py-1 h-8"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Product Inspection Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        threshold={lowStockThreshold}
      />
    </div>
  );
};
