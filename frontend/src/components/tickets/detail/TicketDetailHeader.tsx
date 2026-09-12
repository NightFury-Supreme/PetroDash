'use client';

import React from 'react';
import { Link2 } from 'lucide-react';

interface TicketDetailHeaderProps {
  ticketId: string;
  title:    string;
}

export function TicketDetailHeader({ ticketId, title }: TicketDetailHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/[0.06] bg-transparent px-6 py-4">
      {/* Left side: Title and Pills */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        <div className="flex items-center gap-3">
          {/* ID Pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/70">
            <Link2 size={12} />
            <span>#{ticketId}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
