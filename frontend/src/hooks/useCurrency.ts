"use client";

import { useState, useEffect } from 'react';
import { getCachedBrandingSync, fetchBrandingData, subscribeBranding } from '@/utils/configCache';

export function useCurrency() {
  const [currency, setCurrency] = useState(() => getCachedBrandingSync().currency || 'USD');

  useEffect(() => {
    const unsubscribe = subscribeBranding((b) => {
      if (b.currency) setCurrency(b.currency);
    });

    fetchBrandingData().then((b) => {
      if (b.currency) setCurrency(b.currency);
    });

    return unsubscribe;
  }, []);

  const formatPrice = (amount: number | string) => {
    const num = Number(amount);
    return `${num} ${currency}`;
  };

  return { currency, formatPrice };
}
