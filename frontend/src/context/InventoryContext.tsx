import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ConnectionMode } from '../types/api';
import { apiClient } from '../services/apiClient';
import { getConnectionMode, setConnectionMode as saveConnectionMode } from '../services/productService';
import { mockStore } from '../services/mockStore';

interface InventoryContextType {
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => void;
  backendOnline: boolean | null;
  checkBackendHealth: () => Promise<boolean>;
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetAllData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const THRESHOLD_KEY = 'wms_low_stock_threshold';
const DEFAULT_THRESHOLD = Number(import.meta.env.VITE_DEFAULT_LOW_STOCK_THRESHOLD) || 5;

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lowStockThreshold, setLowStockThresholdState] = useState<number>(() => {
    const saved = localStorage.getItem(THRESHOLD_KEY);
    return saved ? Number(saved) : DEFAULT_THRESHOLD;
  });

  const [connectionMode, setConnectionModeState] = useState<ConnectionMode>(() => {
    return getConnectionMode();
  });

  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const setLowStockThreshold = useCallback((threshold: number) => {
    setLowStockThresholdState(threshold);
    localStorage.setItem(THRESHOLD_KEY, String(threshold));
    triggerRefresh();
  }, [triggerRefresh]);

  const setConnectionMode = useCallback((mode: ConnectionMode) => {
    setConnectionModeState(mode);
    saveConnectionMode(mode);
    triggerRefresh();
  }, [triggerRefresh]);

  const checkBackendHealth = useCallback(async () => {
    const isUp = await apiClient.checkHealth();
    setBackendOnline(isUp);
    return isUp;
  }, []);

  const resetAllData = useCallback(() => {
    mockStore.resetToDefaults();
    triggerRefresh();
  }, [triggerRefresh]);

  useEffect(() => {
    checkBackendHealth();
    // Periodically poll backend health every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return (
    <InventoryContext.Provider
      value={{
        lowStockThreshold,
        setLowStockThreshold,
        connectionMode,
        setConnectionMode,
        backendOnline,
        checkBackendHealth,
        refreshTrigger,
        triggerRefresh,
        resetAllData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
