"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { shortId } from "@/components/tickets/utils";

interface AdminTicketDetailSidebarProps {
  ticket: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    category?: string;
    createdAt: string;
    updatedAt: string;
    deletedByUser?: boolean;
    user?: { username?: string; email?: string };
  };
  username: string;
  adminsText: string;
  actionBusy: string | null;
  actionDone: string | null;
  onUpdateStatus: (status: string, key: string) => void;
  onUpdatePriority: (priority: string) => void;
  onAction: (action: "close" | "resolve" | "delete" | "restore" | "reopen") => void;
}

export function AdminTicketDetailSidebar({
  ticket,
  username,
  adminsText,
  actionBusy,
  actionDone,
  onUpdateStatus,
  onUpdatePriority,
  onAction,
}: AdminTicketDetailSidebarProps) {
  const createdDate = new Date(ticket.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  
  return (
    <aside className="flex w-full flex-col bg-[#0F0F0F] p-2 sm:p-4">
      <div>
        <h3 className="mb-5 text-sm font-semibold text-white/90">Overview</h3>
        <div className="flex flex-col gap-5">

          {/* Priority — dropdown */}
          <div className="border-b border-white/[0.06] pb-4">
            <span className="text-sm font-medium text-white/50 mb-3 block">Priority</span>
            <Select size="sm"
              value={ticket.priority || "low"}
              options={[
                { label: "Low",    value: "low"    },
                { label: "Medium", value: "medium" },
                { label: "High",   value: "high"   },
              ]}
              onChange={onUpdatePriority}
              busy={actionBusy === "priority"}
              done={actionDone === "priority"}
            />
          </div>

          {/* Status — dropdown */}
          <div className="border-b border-white/[0.06] pb-4">
            <span className="text-sm font-medium text-white/50 mb-3 block">Status</span>
            <Select size="sm"
              value={ticket.status || "open"}
              options={[
                { label: "Open",     value: "open"     },
                { label: "Pending",  value: "pending"  },
                { label: "Resolved", value: "resolved" },
                { label: "Closed",   value: "closed"   },
              ]}
              onChange={(v) => onUpdateStatus(v, "status-dropdown")}
              busy={actionBusy === "status-dropdown"}
              done={actionDone === "status-dropdown"}
            />
          </div>

          {/* Metadata */}
          <div className="border-b border-white/[0.06] pb-4 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Category</span>
              <span className="text-white/70 capitalize">{ticket.category || "General"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Ticket ID</span>
              <span className="font-mono text-white/70">#{shortId(ticket._id)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">User</span>
              <span className="text-white/70">{username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Admins</span>
              <span className="text-white/70">{adminsText}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Created</span>
              <span className="text-white/70">{createdDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Updated</span>
              <span className="text-white/70">
                {new Date(ticket.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {ticket.deletedByUser ? (
              <button
                onClick={() => onAction("restore")}
                disabled={!!actionBusy}
                className="w-full rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/[0.12] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionBusy === "restore" ? (
                  <><span className="h-3 w-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" /> Restoring…</>
                ) : actionDone === "restore" ? (
                  <><span className="text-emerald-400">✓</span> Restored!</>
                ) : "Restore Ticket"}
              </button>
            ) : (
              <>
                {(ticket.status === "closed" || ticket.status === "resolved") ? (
                  <button
                    onClick={() => onAction("reopen")}
                    disabled={!!actionBusy}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.07] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionBusy === "reopen" ? (
                      <><span className="h-3 w-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin" /> Reopening…</>
                    ) : actionDone === "reopen" ? (
                      <><span className="text-emerald-400">✓</span> Reopened!</>
                    ) : "Reopen Ticket"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onAction("resolve")}
                      disabled={!!actionBusy}
                      className="w-full rounded-lg border border-[#FF5722]/25 bg-[#FF5722]/[0.06] px-3 py-2 text-xs font-semibold text-[#FF5722] hover:bg-[#FF5722]/[0.12] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {actionBusy === "resolve" ? (
                        <><span className="h-3 w-3 rounded-full border-2 border-[#FF5722] border-t-transparent animate-spin" /> Resolving…</>
                      ) : actionDone === "resolve" ? (
                        <><span className="text-emerald-400">✓</span> Resolved!</>
                      ) : "Resolve Ticket"}
                    </button>
                    <button
                      onClick={() => onAction("close")}
                      disabled={!!actionBusy}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.07] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {actionBusy === "close" ? (
                        <><span className="h-3 w-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin" /> Closing…</>
                      ) : actionDone === "close" ? (
                        <><span className="text-emerald-400">✓</span> Closed!</>
                      ) : "Close Ticket"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => onAction("delete")}
                  disabled={!!actionBusy}
                  className="w-full rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-2 text-xs font-semibold text-red-500/70 hover:bg-red-500/[0.10] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionBusy === "delete" ? (
                    <><span className="h-3 w-3 rounded-full border-2 border-red-500/70 border-t-transparent animate-spin" /> Deleting…</>
                  ) : "Soft Delete"}
                </button>
              </>
            )}
          </div>

          {/* Deleted warning */}
          {ticket.deletedByUser && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              ⚠️ Deleted by user — replies are disabled.
            </div>
          )}

        </div>
      </div>
    </aside>
  );
}
