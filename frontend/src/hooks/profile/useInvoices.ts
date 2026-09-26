'use client';

import { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { downloadInvoicePdf } from '@/utils/invoiceDownload';
import { useToast } from '@/components/ui/ToastProvider';

export interface PaymentItem {
  id: string;
  provider: string;
  providerOrderId?: string;
  providerCaptureId?: string;
  planId: string;
  plan?: {
    name: string;
    interval?: string;
  } | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export function useInvoices(pageSize: number = 10) {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    let active = true;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const res = await fetchWithRetry(
          `${base}/api/payments?paginate=true&page=${page}&pageSize=${pageSize}`,
          { headers: { Authorization: `Bearer ${token || ''}` } }
        );
        const data = await res.json();
        if (active && res.ok) {
          setPayments(data.data || []);
          setTotalPayments(data.meta?.total || 0);
          setTotalPages(Math.ceil((data.meta?.total || 0) / (data.meta?.pageSize || pageSize)) || 1);
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPayments();
    return () => {
      active = false;
    };
  }, [page, pageSize]);

  const downloadInvoice = async (id: string) => {
    try {
      setDownloadingId(id);
      await downloadInvoicePdf(id, false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      showError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  return {
    payments,
    page,
    setPage,
    totalPages,
    totalPayments,
    loading,
    downloadingId,
    downloadInvoice,
  };
}
