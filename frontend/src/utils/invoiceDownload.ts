import { fetchWithRetry } from './fetchWithRetry';

export async function downloadInvoicePdf(invoiceId: string, isAdmin: boolean = false): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('ERR_UNAUTHORIZED');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
  const endpoint = isAdmin
    ? `${API_BASE}/api/admin/payments/${invoiceId}/invoice`
    : `${API_BASE}/api/payments/${invoiceId}/invoice`;

  const r = await fetchWithRetry(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error((d as { error?: string })?.error || 'ERR_INVOICE_FAILED');
  }

  const blob = await r.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoiceId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
