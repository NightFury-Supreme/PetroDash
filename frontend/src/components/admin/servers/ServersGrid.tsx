"use client";

import ServerCard from '@/components/ServerCard/ServerCard';
import UnreachableServerCard from '@/components/ServerCard/UnreachableServerCard';
import SuspendedServerCard from '@/components/ServerCard/SuspendedServerCard';

export default function ServersGrid({ servers, onDelete, deleting }: any) {
  return (
    <div className="grid gap-6">
      {servers.map((server: any) => {
        // Check if server is suspended
        if (server.suspended || server.status === 'suspended') {
          return (
            <SuspendedServerCard
              key={server._id}
              server={server}
            />
          );
        }

        // Check if server is unreachable
        if (server.unreachable || server.status === 'unreachable') {
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
            onDelete={onDelete}
            deleting={deleting}
            editLink={`/admin/servers/edit/${server._id}`}
            viewOwnerLink={`/admin/users/${server.userId._id}`}
          />
        );
      })}
    </div>
  );
}


