import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../services/apiClient';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import {
  Sliders,
  Server,
  Database,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Wifi,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    lowStockThreshold,
    setLowStockThreshold,
    connectionMode,
    setConnectionMode,
    backendOnline,
    checkBackendHealth,
    resetAllData,
  } = useInventory();

  const { success, error: toastError, info } = useToast();

  const [thresholdInput, setThresholdInput] = useState(String(lowStockThreshold));
  const [apiUrl, setApiUrl] = useState(apiClient.getBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(thresholdInput);
    if (!Number.isInteger(val) || val < 1 || val > 1000) {
      toastError('Invalid Threshold', 'Enter an integer between 1 and 1000.');
      return;
    }
    setLowStockThreshold(val);
    success('Threshold Updated', `Low-stock threshold set to ${val} units.`);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      apiClient.setBaseUrl(apiUrl);
      const isUp = await checkBackendHealth();
      if (isUp) {
        setTestResult({
          ok: true,
          message: `Successfully connected to backend server at ${apiUrl}!`,
        });
        success('Backend Online', 'Connected to Spring Boot backend successfully.');
      } else {
        setTestResult({
          ok: false,
          message: `Could not reach ${apiUrl}. Ensure Spring Boot backend is running on port 8080.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetSeedData = () => {
    if (window.confirm('Reset local warehouse inventory to sample seed products (P101, P102, P103)?')) {
      resetAllData();
      info('Data Reset', 'Inventory has been reset to original sample seed data.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            System & Inventory Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize warehouse alert thresholds, configure API connectivity, and toggle between demo and live modes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low-Stock Safety Threshold */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Low-Stock Warning Threshold</span>
            </div>
          }
          subtitle="Products with quantity below this value are flagged as Low-Stock."
        >
          <form onSubmit={handleSaveThreshold} className="space-y-4">
            <FormInput
              label="Safety Threshold (Units)"
              id="threshold-input"
              type="number"
              min="1"
              max="1000"
              value={thresholdInput}
              onChange={e => setThresholdInput(e.target.value)}
              hint="Default: 5 units"
            />
            <Button type="submit" variant="primary" size="sm">
              Save Threshold
            </Button>
          </form>
        </Card>

        {/* Operating Mode Toggle */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              <span>Data Source Mode</span>
            </div>
          }
          subtitle="Toggle between live Spring Boot REST API and interactive local demo mode."
        >
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConnectionMode('demo')}
                className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                  connectionMode === 'demo'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <p className="font-semibold text-xs">Interactive Demo Mode</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Operates locally in-browser with seed products (P101, P102, P103).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setConnectionMode('live')}
                className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                  connectionMode === 'live'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <p className="font-semibold text-xs">Live Backend Mode</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sends HTTP requests to the Spring Boot REST endpoints.
                </p>
              </button>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSeedData}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Local Seed Data
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Backend API Configuration */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span>Backend REST API Integration</span>
          </div>
        }
        subtitle="Configures the central endpoint URI for backend Spring Boot communication."
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <FormInput
                label="API Base URL"
                id="api-url-input"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="http://localhost:8080/api"
                hint="Default: http://localhost:8080/api (configured via VITE_API_BASE_URL)"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleTestConnection}
                isLoading={isTesting}
                leftIcon={<Wifi className="w-4 h-4" />}
              >
                Test Connection
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  apiClient.resetBaseUrl();
                  setApiUrl(apiClient.getBaseUrl());
                  info('URL Reset', 'Reset API Base URL to environment default.');
                }}
              >
                Reset Default
              </Button>
            </div>
          </div>

          {/* Test connection result display */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.ok ? 'Connection Verified' : 'Connection Failed'}</p>
                <p className="mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* REST API Endpoint Specification Reference Table */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Authoritative REST API Routes
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 font-sans">
                  <tr>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Endpoint</th>
                    <th className="py-2 px-3 font-sans">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  <tr>
                    <td className="py-2 px-3 text-blue-600 font-bold">GET</td>
                    <td className="py-2 px-3 text-slate-800">/products</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">List all inventory items</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-blue-600 font-bold">GET</td>
                    <td className="py-2 px-3 text-slate-800">/products/{'{id}'}</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">Fetch individual product details</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-emerald-600 font-bold">POST</td>
                    <td className="py-2 px-3 text-slate-800">/products</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">Add product (AddProductModule)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-amber-600 font-bold">PATCH</td>
                    <td className="py-2 px-3 text-slate-800">/products/{'{id}'}/stock</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">Update stock (StockUpdateModule)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-blue-600 font-bold">GET</td>
                    <td className="py-2 px-3 text-slate-800">/dashboard/summary</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">Inventory KPI summary</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-blue-600 font-bold">GET</td>
                    <td className="py-2 px-3 text-slate-800">/orders</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">List customer orders</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-emerald-600 font-bold">POST</td>
                    <td className="py-2 px-3 text-slate-800">/orders</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">Create order (Create an Order)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-blue-600 font-bold">GET</td>
                    <td className="py-2 px-3 text-slate-800">/products/{'{id}'}/availability?quantity=10</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">Check availability (Availability Module)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-blue-600 font-bold">GET</td>
                    <td className="py-2 px-3 text-slate-800">/stock-history</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">Fetch transaction audit trail</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
