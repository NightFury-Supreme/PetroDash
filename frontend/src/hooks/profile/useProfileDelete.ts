"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export function useProfileDelete() {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteAccount = useCallback(async (password?: string, tfaCode?: string) => {
    const token = localStorage.getItem('auth_token');
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile`, { 
      method: 'DELETE', 
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ password: password || undefined, tfaCode: tfaCode || undefined })
    });
    let d: any = {}; 
    try { d = await r.json(); } catch {} 
    if (!r.ok) throw new Error(d?.error || 'failedToDeleteAccount');
    
    setTimeout(() => {
      localStorage.removeItem('auth_token');
      router.push('/register');
    }, 1000);
  }, [router]);

  return {
    deleteOpen,
    setDeleteOpen,
    deleteAccount,
  };
}
