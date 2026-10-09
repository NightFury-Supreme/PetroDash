"use client";

import { AdminServerTableRow } from "./AdminServerTableRow";

type Server = {
  _id: string;
  clientUrl?: string;
  name: string;
  status: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    oauthProviders?: {
      discord?: { avatar?: string };
      google?: { picture?: string };
    };
  };
  egg: { _id: string; name: string; icon?: string };
  location: { _id: string; name: string; flag?: string };
  limits: {
    diskMb: number;
    memoryMb: number;
    cpuPercent: number;
    backups: number;
    databases: number;
    allocations: number;
  };
  createdAt: string;
  suspended?: boolean;
  unreachable?: boolean;
};

interface AdminServersTableProps {
  servers: Server[];
  onDelete: (serverId: string, serverName: string) => void;
  onEdit: (serverId: string) => void;
  deleting: string | null;
  hideOwner?: boolean;
}

export default function AdminServersTable({
  servers,
  onDelete,
  onEdit,
  deleting,
  hideOwner = false,
}: AdminServersTableProps) {
  const cols = hideOwner
    ? "lg:grid-cols-[1fr_1fr_1fr_100px_80px_100px_100px_120px]"
    : "lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_120px]";

  return (
    <div>
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
          <span>Server Name</span>
          {!hideOwner && <span>Owner</span>}
          <span>Node</span>
          <span>Egg</span>
          <span>Status</span>
          <span>CPU</span>
          <span>RAM</span>
          <span>Disk</span>
          <span className="text-right">Actions</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-[#222]">
          {servers.length === 0 ? (
            <div className="text-center py-16 text-xs text-[#555]">
              No servers found.
            </div>
          ) : (
            servers.map((server) => (
              <AdminServerTableRow
                key={server._id}
                server={server}
                onDelete={onDelete}
                onEdit={onEdit}
                deleting={deleting}
                hideOwner={hideOwner}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
