"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TicketsHeader({
  title,
  description,
  loading: _loading,
  onRefresh: _onRefresh,
  onNew
}: {
  title?: string;
  description?: string;
  loading?: boolean;
  onRefresh?: () => void;
  onNew?: () => void;
}) {
  const t = useTranslations('Tickets');
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{title || 'Support Tickets'}</h1>
        <p className="mt-1 text-sm text-[#888888]">{description || 'Manage all user tickets and requests.'}</p>
      </div>
      {onNew && (
        <div className="flex items-center gap-3">
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
          >
            <Plus size={12} />
            <span>{t('createTicket') || 'Create Ticket'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
