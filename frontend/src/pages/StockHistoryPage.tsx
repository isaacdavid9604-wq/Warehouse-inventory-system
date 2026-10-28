import React, { useState, useEffect, useCallback } from 'react';
import { useInventory } from '../context/InventoryContext';
import { historyService } from '../services/historyService';
import { StockHistoryItem } from '../types/history';
import { Button } from '../components/common/Button';
import { TableSkeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatNumber } from '../utils/formatters';
import { History, RefreshCw, ArrowUpRight, ArrowDownRight, Minus, Search, Filter } from 'lucide-react';

export const StockHistoryPage: React.FC = () => {
  const { refreshTrigger } = useInventory();
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<string>('ALL');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await historyService.getStockHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load stock audit history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const filteredHistory = history.filter(item => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      item.productId.toLowerCase().includes(query) ||
      item.productName.toLowerCase().includes(query);

    const matchesOp =
      selectedOperation === 'ALL' || item.operationType === selectedOperation;

    return matchesSearch && matchesOp;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Stock Change Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete transaction history of additions, adjustments, restocks, and order fulfillments.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHistory}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Log
        </Button>
      </div>

      {error && <ErrorAlert title="Audit History Notice" message={error} onRetry={fetchHistory} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Product ID or name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedOperation}
            onChange={e => setSelectedOperation(e.target.value)}
            className="w-full md:w-auto rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Operations</option>
            <option value="INITIAL">Initial Ingestion</option>
            <option value="STOCK_UPDATE">Stock Update</option>
            <option value="RESTOCK">Restock</option>
            <option value="ORDER_FULFILLMENT">Order Fulfillment</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8" />}
            title="No Stock History Records"
            description={
              searchQuery || selectedOperation !== 'ALL'
                ? 'No transaction logs match the selected filter.'
                : 'Stock transactions will appear here as inventory changes are submitted.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Log ID</th>
                  <th className="px-6 py-3.5">Product ID</th>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Previous</th>
                  <th className="px-6 py-3.5">New Qty</th>
                  <th className="px-6 py-3.5">Net Change</th>
                  <th className="px-6 py-3.5">Operation</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map(item => {
                  const isPositive = item.quantityChange > 0;
                  const isNegative = item.quantityChange < 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-slate-500 text-[11px]">
                        {item.id}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-semibold text-slate-900">
                        {item.productId}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">
                        {formatNumber(item.previousQuantity)}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                        {formatNumber(item.newQuantity)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isNegative
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isNegative && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5" />}
                          {isPositive ? `+${item.quantityChange}` : item.quantityChange}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {item.operationType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                        {formatDate(item.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
