import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          isCollapsed={isCollapsed}
          onOpenMobile={() => setIsMobileOpen(true)}
        />

        <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto ${
          isCollapsed ? 'lg:pl-24' : 'lg:pl-72'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
