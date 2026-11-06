import { useState } from 'react';
import { AdminStoreTab } from './types';

export function useAdminStore(initialTab: AdminStoreTab = 'shop') {
  const [activeTab, setActiveTab] = useState<AdminStoreTab>(initialTab);

  return {
    activeTab,
    setActiveTab,
  };
}
