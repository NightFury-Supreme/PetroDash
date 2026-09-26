import { useState, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface LedgerQueryParams {
  status?: string;
  provider?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function useAdminLedger(initialParams: LedgerQueryParams = {}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [refunding, setRefunding] = useState<string | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = useCallback(async (params: LedgerQueryParams = initialParams) => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('ERR_UNAUTHORIZED');
      }

      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.provider) q.set('provider', params.provider);
      if (params.search) q.set('search', params.search);
      if (params.sort) q.set('sort', params.sort);
      q.set('page', (params.page || 1).toString());
      q.set('limit', (params.limit || 10).toString());

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/ledger?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'ERR_PAYMENTS_LOAD_FAILED');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
        setPagination({ page: 1, totalPages: 1, total: data.length });
      } else {
        setItems(data.payments || []);
        setPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'ERR_PAYMENTS_LOAD_FAILED');
    } finally {
      setLoading(false);
    }
  }, []);

  const refundPayment = useCallback(async (id: string): Promise<boolean> => {
    setRefunding(id);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/${id}/refund`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'ERR_REFUND_FAILED');
      }
      return true;
    } finally {
      setRefunding(null);
    }
  }, []);

  const voidPayment = useCallback(async (id: string): Promise<boolean> => {
    setVoiding(id);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/${id}/void`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'ERR_VOID_FAILED');
      }
      return true;
    } finally {
      setVoiding(null);
    }
  }, []);

  const downloadInvoice = useCallback(async (paymentId: string): Promise<void> => {
    setDownloading(paymentId);
    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${baseUrl}/api/admin/payments/${paymentId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'ERR_INVOICE_FAILED');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } finally {
      setDownloading(null);
    }
  }, []);

  return {
    items,
    loading,
    error,
    pagination,
    refunding,
    voiding,
    downloading,
    load,
    refundPayment,
    voidPayment,
    downloadInvoice,
  };
}
