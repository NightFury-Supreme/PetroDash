"use client";

import ServerCard from '@/components/ServerCard';

export default function ServersGrid({ servers, onDelete, deleting }: any) {
  return (
    <div className="grid gap-6">
      {servers.map((server: any) => (
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
      ))}
    </div>
  );
}


