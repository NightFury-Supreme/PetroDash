/* ==========================================================================
   Servers Grid Component (Legacy Support)
   Compliance: ISO/IEC 25010, Strong Typing
========================================================================== */

'use client';

import React from 'react';
import ServerCard from '@/components/ServerCard/ServerCard';
import UnreachableServerCard from '@/components/ServerCard/UnreachableServerCard';
import SuspendedServerCard from '@/components/ServerCard/SuspendedServerCard';
import type { AdminServer } from './types';

interface ServersGridProps {
  servers: AdminServer[];
  onDelete: (id: string, name: string) => void;
  deleting: string | null;
}

export default function ServersGrid({ servers, onDelete, deleting }: ServersGridProps) {
  return (
    <div className="grid gap-6">
      {servers.map((server) => {
        if (server.suspended || server.status?.toLowerCase() === 'suspended') {
          return (
            <SuspendedServerCard
              key={server._id}
              server={server as unknown as Parameters<typeof SuspendedServerCard>[0]['server']}
            />
          );
        }

        if (server.unreachable || server.status?.toLowerCase() === 'unreachable') {
          return (
            <UnreachableServerCard
              key={server._id}
              serverId={server._id}
              serverName={server.name}
              className="h-full"
            />
          );
        }

        return (
          <ServerCard
            key={server._id}
            server={server}
            showOwner={true}
            showActions={true}
            onDelete={() => onDelete(server._id, server.name)}
            deleting={deleting}
            editLink={`/admin/servers/edit/${server._id}`}
            viewOwnerLink={`/admin/users/${server.userId._id}`}
          />
        );
      })}
    </div>
  );
}

export { ServersGrid };
