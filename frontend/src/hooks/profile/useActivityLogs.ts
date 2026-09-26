'use client';

import { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface ActivityLogItem {
  _id: string;
  action: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
}

export function useActivityLogs(limit: number = 10) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const base = process.env.NEXT_PUBLIC_API_BASE || '';

    fetchWithRetry(`${base}/api/activity?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (active && data.success) {
          setLogs(data.data || []);
          setTotalLogs(data.pagination?.total || 0);
          setTotalPages(data.pagination?.pages || 1);
        }
        if (active) setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, limit]);

  return {
    logs,
    loading,
    page,
    setPage,
    totalPages,
    totalLogs,
  };
}
