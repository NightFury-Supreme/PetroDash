import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState } from 'react';



interface AdminLedgerTableProps {
  items: any[];
  onRefund: (id: string) => void;
  onVoid: (id: string) => void;
  refunding: string | null;
  voiding: string | null;
}

export function AdminLedgerTable({
  items,
  onRefund,
  onVoid,
  refunding,
  voiding
}: AdminLedgerTableProps) {
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'CREATED': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: 'fa-clock' },
      'COMPLETED': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: 'fa-check-circle' },
      'FAILED': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: 'fa-times-circle' },
      'REFUNDED': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: 'fa-undo' },
      'VOIDED': { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: 'fa-ban' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['CREATED'];

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <i className={`fas ${config.icon}`}></i>
        {status}
      </span>
    );
  };

  const getActionMenu = (item: any) => {
    const canRefund = item.status === 'COMPLETED' && item.provider === 'paypal';
    const canVoid = item.status === 'CREATED' && item.provider === 'paypal';
    const canInvoice = item.status === 'COMPLETED';

    const handleDownloadInvoice = async (paymentId: string) => {
      try {
        const token = localStorage.getItem('auth_token');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || '';
        const res = await fetchWithRetry(`${baseUrl}/api/admin/payments/${paymentId}/invoice`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to download invoice');
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } catch (err) {
        console.error(err);
        alert('Failed to download invoice');
      }
    };

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenuFor(showMenuFor === item._id ? null : item._id)}
          className="w-8 h-8 bg-[#202020] hover:bg-[#272727] border border-[#303030] hover:border-[#404040] rounded-lg flex items-center justify-center transition-colors"
          title="Actions"
        >
          <i className="fas fa-ellipsis-v text-[#AAAAAA] text-sm"></i>
        </button>

        {showMenuFor === item._id && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-[#181818] border border-[#303030] rounded-lg shadow-xl z-10">
            <div className="py-1">
              {canInvoice && (
                <button
                  onClick={() => {
                    handleDownloadInvoice(item._id);
                    setShowMenuFor(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-[#AAAAAA] hover:text-white hover:bg-[#202020] transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-file-pdf"></i>
                  Download Invoice
                </button>
              )}
              {canRefund && (
                <button
                  onClick={() => {
                    onRefund(item._id);
                    setShowMenuFor(null);
                  }}
                  disabled={refunding === item._id}
                  className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-[#202020] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="fas fa-undo"></i>
                  {refunding === item._id ? 'Refunding...' : 'Refund'}
                </button>
              )}
              
              {canVoid && (
                <button
                  onClick={() => {
                    onVoid(item._id);
                    setShowMenuFor(null);
                  }}
                  disabled={voiding === item._id}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#202020] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="fas fa-ban"></i>
                  {voiding === item._id ? 'Voiding...' : 'Void'}
                </button>
              )}
              
              {!canRefund && !canVoid && !canInvoice && (
                <div className="px-4 py-2 text-xs text-[#AAAAAA]">
                  No actions available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-[#202020] rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-inbox text-[#AAAAAA] text-xl"></i>
        </div>
        <h3 className="text-white font-medium mb-2">No payments found</h3>
        <p className="text-[#AAAAAA] text-sm">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#181818] border border-[#303030] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-[#202020] border-b border-[#303030]">
              <th className="px-6 py-4 text-left text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">Provider</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#303030]">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-[#202020] transition-colors">
                <td className="px-6 py-4 text-sm text-white whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-[#AAAAAA]">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{item.userId?.username || 'Unknown'}</span>
                    <span className="text-xs">{item.userId?.email || item.userId || ''}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#AAAAAA]">
                  {item.planId?.name || item.planId || 'Unknown'}
                </td>
                <td className="px-6 py-4 text-sm text-[#AAAAAA]">
                  <span className="inline-flex items-center gap-2 px-2 py-1 bg-[#202020] rounded-lg text-xs">
                    <i className="fas fa-credit-card"></i>
                    {item.provider}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[#AAAAAA] font-mono whitespace-nowrap">
                  {item.providerOrderId}
                </td>
                <td className="px-6 py-4 text-sm text-white font-medium whitespace-nowrap">
                  {Number(item.amount || 0).toFixed(2)} {item.currency || 'USD'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>
                <td className="px-6 py-4">
                  {getActionMenu(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
