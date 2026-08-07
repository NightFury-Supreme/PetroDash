"use client";

import { useState, useRef, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-600/20 text-green-300 border-green-700/50",
  pending: "bg-yellow-600/20 text-yellow-300 border-yellow-700/50",
  resolved: "bg-blue-600/20 text-blue-300 border-blue-700/50",
  closed: "bg-[#303030] text-[#AAAAAA] border-[#404040]",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-600/20 text-red-300 border-red-700/50",
  medium: "bg-yellow-600/20 text-yellow-300 border-yellow-700/50",
  low: "bg-[#303030] text-[#AAAAAA] border-[#404040]",
};

function CustomDropdown({
  value,
  options,
  colors,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  colors: Record<string, string>;
  onChange: (val: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeColor = colors[value] || colors[options[0].value];
  const activeLabel = options.find((o) => o.value === value)?.label || value.toUpperCase();

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border cursor-pointer outline-none transition-colors ${activeColor}`}
      >
        <span>{activeLabel}</span>
        <i className="fas fa-chevron-down text-[8px] opacity-70" />
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-28 rounded-lg border border-[#303030] bg-[#181818] shadow-xl z-50 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={async () => {
                await onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[10px] uppercase tracking-wider hover:bg-[#202020] transition-colors ${
                value === opt.value ? "font-bold text-white bg-[#202020]" : "text-[#AAAAAA]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTicketDetailHeader({
  ticket,
  contentPadding,
  onAction,
  onStatusChange,
  onPriorityChange,
}: {
  ticket: any;
  contentPadding: number;
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
    <div className="fixed top-0 right-0 z-40" style={{ left: contentPadding }}>
      <div className="h-20 px-4 md:px-8 flex items-center justify-between border-b border-[#202020] bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="flex items-center gap-4 w-full">
          <a href="/admin/tickets" className="w-10 h-10 rounded-xl border border-[#303030] flex items-center justify-center text-white hover:bg-[#111]">
            <i className="fas fa-arrow-left" />
          </a>
          <div className="w-12 h-12 bg-[#202020] border border-[#303030] rounded-2xl flex items-center justify-center text-white">
            <i className="fa-solid fa-ticket" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-white truncate max-w-xs">{ticket?.title || "Ticket"}</h1>
              {ticket?.deletedByUser && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-600/20 text-red-300 border-red-700/50">DELETED</span>
              )}
              {ticket?.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#303030] text-white border-[#404040]">
                  <i className="fas fa-folder mr-1" />{ticket.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#AAAAAA]">{ticket?.user?.username || ticket?.user?.email || "User"}</span>
              <CustomDropdown
                value={ticket?.status || "open"}
                options={[
                  { label: "OPEN", value: "open" },
                  { label: "PENDING", value: "pending" },
                  { label: "RESOLVED", value: "resolved" },
                  { label: "CLOSED", value: "closed" },
                ]}
                colors={STATUS_COLORS}
                onChange={async (v) => { await onStatusChange(v); }}
              />
              <CustomDropdown
                value={ticket?.priority || "low"}
                options={[
                  { label: "LOW", value: "low" },
                  { label: "MEDIUM", value: "medium" },
                  { label: "HIGH", value: "high" },
                ]}
                colors={PRIORITY_COLORS}
                onChange={async (v) => { await onPriorityChange(v); }}
              />
            </div>
          </div>
          <div className="relative ml-auto flex-shrink-0" ref={menuRef}>
            <button
              className="w-10 h-10 rounded-xl border border-[#303030] flex items-center justify-center text-white hover:bg-[#111]"
              onClick={() => setMenuOpen(v => !v)}
            >
              <i className="fas fa-ellipsis-h" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#303030] bg-[#181818] shadow-xl z-50 overflow-hidden">
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
                    <button
                      onClick={async () => { await onAction("delete"); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#202020]"
                    >
                      Soft Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={async () => { await onAction("restore"); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-[#202020]"
                  >
                    Restore
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
