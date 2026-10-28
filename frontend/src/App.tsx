import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { InventoryProvider } from './context/InventoryContext';
import { MainLayout } from './layouts/MainLayout';

import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { AddProductPage } from './pages/AddProductPage';
import { UpdateStockPage } from './pages/UpdateStockPage';
import { OrdersPage } from './pages/OrdersPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { StockHistoryPage } from './pages/StockHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <InventoryProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/add" element={<AddProductPage />} />
              <Route path="stock/update" element={<UpdateStockPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="availability" element={<AvailabilityPage />} />
              <Route path="history" element={<StockHistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </InventoryProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
