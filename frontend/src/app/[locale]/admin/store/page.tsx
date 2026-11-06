"use client";

import React from 'react';
import {
  AdminStoreHeader,
  AdminStoreSidebar,
  AdminStoreContent,
} from '@/components/admin/store';
import { useAdminStore } from '@/hooks/admin/store';

export default function AdminStorePage() {
  const { activeTab, setActiveTab } = useAdminStore();

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col h-full space-y-6">
        <AdminStoreHeader />
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AdminStoreSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <AdminStoreContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
