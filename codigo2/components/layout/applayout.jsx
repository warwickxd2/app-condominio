import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 glass border-b border-white/10 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}