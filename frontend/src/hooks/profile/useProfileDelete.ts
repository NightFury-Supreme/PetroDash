"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export function useProfileDelete() {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteAccount = useCallback(async (password?: string, tfaCode?: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      },
      body: JSON.stringify({ password: password || undefined, tfaCode: tfaCode || undefined }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d?.error || 'ERR_DELETE_USER_FAILED');

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    router.push('/register');
  }, [router]);

  return {
    deleteOpen,
    setDeleteOpen,
    deleteAccount,
  };
}
