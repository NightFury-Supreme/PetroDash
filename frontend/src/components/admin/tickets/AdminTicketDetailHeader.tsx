"use client";

import { useState, useRef, useEffect } from "react";
import { Select } from "@/components/ui/Select";

// const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-600/20 text-green-300 border-green-700/50",
  pending: "bg-yellow-600/20 text-yellow-300 border-yellow-700/50",
  resolved: "bg-blue-600/20 text-blue-300 border-blue-700/50",
  closed: "bg-[#303030] text-[#AAAAAA] border-[#404040]",
};

// const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-[#FF3333]/10 text-[#FF3333] border-[#FF3333]/20",
  medium: "bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20",
  low: "bg-[#303030]/50 text-[#888] border-[#333]",
};

export default function AdminTicketDetailHeader({
  ticket,
  onAction,
  onStatusChange,
  onPriorityChange,
}: {
  ticket: any;
  onAction: (action: "close" | "resolve" | "delete" | "restore" | "reopen") => Promise<void>;
  onStatusChange: (s: string) => Promise<void>;
  onPriorityChange: (p: string) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Select size="sm"
        value={ticket.status || "open"}
        options={[
          { label: "OPEN",     value: "open"     },
          { label: "PENDING",  value: "pending"  },
          { label: "RESOLVED", value: "resolved" },
          { label: "CLOSED",   value: "closed"   },
        ]}
        
        onChange={onStatusChange}
      />
      <Select size="sm"
        value={ticket.priority || "low"}
        options={[
          { label: "LOW",    value: "low"    },
          { label: "MEDIUM", value: "medium" },
          { label: "HIGH",   value: "high"   },
        ]}
        
        onChange={onPriorityChange}
      />

      <div className="relative ml-2 flex-shrink-0" ref={menuRef}>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[#222] bg-[#161616] text-[#888] transition-colors hover:text-[#D4D4D4] bg-transparent rounded-lg"
          onClick={() => setMenuOpen(v => !v)}
        >
          <i className="fas fa-ellipsis-h" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#222] bg-[#161616] shadow-xl z-50 overflow-hidden">
            {!ticket?.deletedByUser ? (
              <>
                {(ticket?.status === 'closed' || ticket?.status === 'resolved') ? (
                  <button
                    onClick={async () => { await onAction("reopen"); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]"
                  >
                    Reopen Ticket
                  </button>
                ) : (
                  <>
                    <button
                      onClick={async () => { await onAction("close"); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]"
                    >
                      Close Ticket
                    </button>
                    <button
                      onClick={async () => { await onAction("resolve"); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]"
                    >
                      Resolve
                    </button>
                  </>
                )}
                <div className="h-px w-full bg-[#222]" />
                <button
                  onClick={async () => { await onAction("delete"); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#FF3333] hover:bg-[#202020]"
                >
                  Soft Delete
                </button>
              </>
            ) : (
              <button
                onClick={async () => { await onAction("restore"); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-[#202020]"
              >
                Restore Ticket
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
