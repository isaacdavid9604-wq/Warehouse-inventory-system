import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  RefreshCw,
  ShoppingCart,
  CheckCircle,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  X,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Boxes },
    { name: 'Add Product', path: '/products/add', icon: PlusCircle },
    { name: 'Update Stock', path: '/stock/update', icon: RefreshCw },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
    { name: 'Availability', path: '/availability', icon: CheckCircle },
    { name: 'Stock History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 border-r border-slate-800/80 text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-600/30">
              <Warehouse className="w-5 h-5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="truncate">
                <h1 className="font-bold text-white text-sm tracking-tight truncate">
                  Warehouse WMS
                </h1>
                <p className="text-[11px] text-slate-400 truncate">Inventory System</p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (Desktop only) */}
        <div className="hidden lg:flex p-3 border-t border-slate-800 justify-end">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
