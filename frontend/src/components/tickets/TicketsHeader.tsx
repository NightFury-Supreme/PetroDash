"use client";

import React from "react";
import { Plus } from "lucide-react";

export default function TicketsHeader({
  title = "Support Tickets",
  description = "Manage all user tickets and requests.",
  _loading,
  _onRefresh,
  onNew
}: {
  title?: string;
  description?: string;
  loading?: boolean;
  _onRefresh?: () => void;
  onNew?: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-[#888888]">{description}</p>
      </div>
      {onNew && (
        <div className="flex items-center gap-3">
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
          >
            <Plus size={12} />
            <span>Create Ticket</span>
          </button>
        </div>
      )}
    </div>
  );
}
