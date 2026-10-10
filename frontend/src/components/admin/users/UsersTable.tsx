"use client";

import { RankBadge } from "@/components/ui/RankBadge";

export default function UsersTable({ users, onManageUser }: { users: any[], onManageUser: (id: string) => void }) {
  if (!users || users.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#666]">
        No users found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden gap-4 grid-cols-[1.5fr_1.5fr_100px_100px_80px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 xl:grid">
        <span>Email</span>
        <span>Username</span>
        <span>Role</span>
        <span>Status</span>
        <span>Servers</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {users.map((u) => (
          <div
            key={u._id}
            className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] xl:grid xl:grid-cols-[1.5fr_1.5fr_100px_100px_80px_100px] xl:items-center"
          >
            <div className="min-w-0 flex items-center">
              <span className="truncate text-sm font-medium text-white/70">
                {u.email}
              </span>
            </div>

            <div className="min-w-0 flex items-center">
              <span className="truncate text-sm font-medium text-white/70">
                {u.username}
              </span>
            </div>

            <div className="flex items-center">
              <RankBadge rank={u.role || 'user'} />
            </div>

            <div className="flex items-center">
              {u.ban?.isBanned ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <i className="fas fa-ban text-[10px]"></i> Banned
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-500">
                  <i className="fas fa-check-circle text-[10px]"></i> Active
                </span>
              )}
            </div>

            <div className="flex items-center">
              <span className="text-sm font-medium text-white/70">{u.serversCount || 0}</span>
            </div>

            <div className="flex justify-end mt-2 xl:mt-0">
              <button
                onClick={() => onManageUser(u._id)}
                className="inline-flex h-8 items-center justify-center rounded border border-white/[0.07] bg-white/[0.035] px-3 text-xs font-medium text-white/70 transition hover:bg-white/[0.07]"
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


