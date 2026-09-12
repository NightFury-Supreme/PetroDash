import React from 'react';
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton';

import { SidebarSkeleton } from './SidebarSkeleton';

// Full page skeleton with sidebar
export function FullPageSkeleton() {
  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      <SidebarSkeleton />

      {/* Main content wrapper with margin matching sidebar width */}
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  );
}


