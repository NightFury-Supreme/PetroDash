'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export type UsernameAvailability = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export function useCheckUsername(username: string, currentValue: string = '', isEditing: boolean = false, isValidFormat: boolean = true) {
  const [availability, setAvailability] = useState<UsernameAvailability>('idle');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setAvailability('idle');
      return;
    }

    const trimmed = username.trim();
    if (!isValidFormat || !trimmed || trimmed === (currentValue || '').trim()) {
      setAvailability('idle');
      return;
    }

    setAvailability('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const res = await fetchWithRetry(
          `${base}/api/auth/check-username?username=${encodeURIComponent(trimmed)}`,
          { headers: { Authorization: `Bearer ${token || ''}` } }
        );
        const data = await res.json();
        setAvailability(data.available ? 'available' : 'taken');
      } catch {
        setAvailability('error');
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, currentValue, isEditing, isValidFormat]);

  return { availability, setAvailability };
}
