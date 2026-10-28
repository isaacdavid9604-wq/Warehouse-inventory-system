import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { Menu, Wifi, WifiOff, Database } from 'lucide-react';

interface NavbarProps {
  onOpenMobile: () => void;
  isCollapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobile, isCollapsed }) => {
  const location = useLocation();
  const { connectionMode, backendOnline } = useInventory();

  // Dynamic route metadata
  const routeTitles: Record<string, { title: string; parent?: string }> = {
    '/': { title: 'Inventory Dashboard' },
    '/products': { title: 'Product Catalog' },
    '/products/add': { title: 'Add New Product', parent: 'Products' },
    '/stock/update': { title: 'Update Stock Quantity' },
    '/orders': { title: 'Order Management' },
    '/availability': { title: 'Product Availability Check' },
    '/history': { title: 'Stock Audit History' },
    '/settings': { title: 'System Settings' },
  };

  const currentRoute = routeTitles[location.pathname] || { title: 'Warehouse Management' };

  return (
    <header className={`sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300 ${
      isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
    }`}>
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Titles & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Warehouse
              </Link>
              {currentRoute.parent && (
                <>
                  <span>/</span>
                  <Link to="/products" className="hover:text-blue-600 transition-colors">
                    {currentRoute.parent}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-slate-700 font-semibold">{currentRoute.title}</span>
            </nav>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {currentRoute.title}
            </h2>
          </div>
        </div>

        {/* Right: Backend status badge + User Profile */}
        <div className="flex items-center gap-3">
          {/* Connection Status Pill */}
          <Link
            to="/settings"
            title="Click to configure backend API settings"
            className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              connectionMode === 'live'
                ? backendOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {connectionMode === 'live' ? (
              backendOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Backend Live (8080)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>Backend Offline</span>
                </>
              )
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>Interactive Demo Mode</span>
              </>
            )}
          </Link>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 sm:pl-3 sm:border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-blue-500/20 shadow-sm">
              IK
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">
                Isaac K.
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-none">
                Inventory Lead
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
