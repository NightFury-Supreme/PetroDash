"use client";

import { useState, useEffect } from 'react';

export function useCurrency() {
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/branding`)
      .then((res) => res.json())
      .then((data) => {
        if (data.currency) setCurrency(data.currency);
      })
      .catch(() => {});
  }, []);

  const formatPrice = (amount: number | string) => {
    const num = Number(amount);
    return `${num} ${currency}`;
  };

  return { currency, formatPrice };
}
