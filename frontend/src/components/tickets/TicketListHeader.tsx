import React from 'react';

export function TicketListHeader() {
  return (
    <div className="mb-1 hidden grid-cols-[1fr_110px_130px_100px_36px] gap-4 border-b border-white/[0.06] pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
      <span>Ticket</span>
      <span>Category</span>
      <span>Updated</span>
      <span>Status</span>
      <span />
    </div>
  );
}
