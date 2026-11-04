'use client';

import React from 'react';
import { ServerCard, UnreachableServerCard, SuspendedServerCard } from '@/components/server';
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
              key={server.id}
              server={server as unknown as Parameters<typeof SuspendedServerCard>[0]['server']}
            />
          );
        }

        if (server.unreachable || server.status?.toLowerCase() === 'unreachable') {
          return (
            <UnreachableServerCard
              key={server.id}
              serverId={server.id}
              serverName={server.name}
              className="h-full"
            />
          );
        }

        return (
          <ServerCard
            key={server.id}
            server={server}
            showOwner={true}
            showActions={true}
            onDelete={() => onDelete(server.id, server.name)}
            deleting={deleting}
            editLink={`/admin/servers/edit/${server.id}`}
            viewOwnerLink={`/admin/users/${server.userId.id}`}
          />
        );
      })}
    </div>
  );
}

export { ServersGrid };
