"use client";

import ServerCard from "../ServerCard/ServerCard";
import UnreachableServerCard from "../ServerCard/UnreachableServerCard";
import SuspendedServerCard from "../ServerCard/SuspendedServerCard";
import { ServerInfo } from "./types";

interface ServersSectionProps {
  servers: ServerInfo[];
  onDelete: (serverId: string, serverName: string) => Promise<void>;
  deleting: string | null;
}

export function ServersSection({ servers, onDelete, deleting }: ServersSectionProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Your Servers</h2>
        <p className="text-[#AAAAAA] text-sm sm:text-base">Manage and monitor your hosting infrastructure</p>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-16 bg-[#202020] border border-[#303030] rounded-2xl">
          <div className="w-24 h-24 mx-auto mb-6 bg-[#181818] rounded-full flex items-center justify-center">
            <i className="fas fa-server text-[#AAAAAA] text-3xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No servers yet</h3>
          <p className="text-[#AAAAAA] mb-6">Create your first server to get started with hosting</p>
          <div className="text-sm text-[#AAAAAA]">
            <i className="fas fa-info-circle mr-2"></i>
            Use the "Create a server" button in the sidebar
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {servers.map((server) => {
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

            // Transform server data to match ServerCard format
            const transformedServer = {
              _id: server._id,
              name: server.name,
              status: server.status,
              userId: { _id: '', username: 'You', email: '' },
              egg: { _id: '', name: server.eggName || 'Unknown' },
              location: { _id: '', name: server.location },
              limits: {
                diskMb: server.storage || 0,
                memoryMb: server.memory || 0,
                cpuPercent: server.cpu || 0,
                backups: server.backups || 0,
                databases: server.databases || 0,
                allocations: server.allocations || 1
              },
              clientUrl: server.url,
              createdAt: new Date().toISOString()
            };

            return (
              <ServerCard
                key={server._id}
                server={transformedServer}
                showOwner={false}
                showActions={true}
                onDelete={onDelete}
                deleting={deleting}
                editLink={`/server/edit/${server._id}`}
                className="h-full"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
