import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AdminStoreTab } from './types';

const VALID_TABS: AdminStoreTab[] = ['shop', 'plans', 'coupons', 'ledger'];

export function useAdminStore() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getInitialTab = (): AdminStoreTab => {
    const paramTab = searchParams.get('tab') as AdminStoreTab | null;
    if (paramTab && VALID_TABS.includes(paramTab)) {
      return paramTab;
    }
    return 'shop';
  };

  const [activeTab, setActiveTabState] = useState<AdminStoreTab>(getInitialTab);

  useEffect(() => {
    const paramTab = searchParams.get('tab') as AdminStoreTab | null;
    if (paramTab && VALID_TABS.includes(paramTab) && paramTab !== activeTab) {
      setActiveTabState(paramTab);
    }
  }, [searchParams, activeTab]);

  const setActiveTab = useCallback(
    (tab: AdminStoreTab) => {
      setActiveTabState(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'shop') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const newQuery = params.toString();
      const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return {
    activeTab,
    setActiveTab,
  };
}
