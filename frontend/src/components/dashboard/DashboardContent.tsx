"use client";

import { useState, useCallback } from 'react';
import { useModal } from '../Modal';
import { useDashboard } from '../../hooks/useDashboard';
import { ResourceCard } from './ResourceCard';
import { AdditionalResourceCard } from './AdditionalResourceCard';
import { ServersSection } from './ServersSection';

export function DashboardContent() {
  const { servers, usage, resources, removeServer } = useDashboard();
  const [deleting, setDeleting] = useState<string | null>(null);
  const modal = useModal();

  // Handle server deletion with useCallback to prevent re-renders
  const handleDelete = useCallback(async (serverId: string, serverName: string) => {
    const confirmed = await modal.confirm({
      title: 'Delete Server',
      body: `Are you sure you want to delete "${serverName}"? This action cannot be undone and will remove the server from both the panel and database.`,
      confirmText: 'Delete'
    });

    if (!confirmed) return;

    setDeleting(serverId);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers/${serverId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to delete server');
      }

      // Remove from local state
      removeServer(serverId);

      await modal.success({
        title: 'Server Deleted',
        body: `Server "${serverName}" has been deleted successfully.`
      });
    } catch (err: any) {
      await modal.error({
        title: 'Error',
        body: err.message || 'Failed to delete server'
      });
    } finally {
      setDeleting(null);
    }
  }, [modal, removeServer]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
          <i className="fas fa-tachometer-alt text-white text-lg sm:text-2xl"></i>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Dashboard
          </h1>
          <p className="text-[#AAAAAA] text-base sm:text-lg">Welcome to your server management console</p>
        </div>
      </header>

      {/* Resource Usage Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ResourceCard
          title="Servers"
          used={usage.servers}
          limit={resources?.serverSlots || 0}
          unit="servers"
          icon="fa-server"
          color="bg-[#303030]"
        />
        
        <ResourceCard
          title="Memory"
          used={usage.memoryMb}
          limit={resources?.memoryMb || 0}
          unit="MB"
          icon="fa-memory"
          color="bg-[#303030]"
        />
        
        <ResourceCard
          title="CPU"
          used={usage.cpuPercent}
          limit={resources?.cpuPercent || 0}
          unit="%"
          icon="fa-microchip"
          color="bg-[#303030]"
        />
        
        <ResourceCard
          title="Disk"
          used={usage.diskMb}
          limit={resources?.diskMb || 0}
          unit="MB"
          icon="fa-hdd"
          color="bg-[#303030]"
        />
      </div>

      {/* Additional Resources - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <AdditionalResourceCard
          title="Databases"
          used={usage.databases}
          limit={resources?.databases || 0}
          icon="fa-database"
        />
        
        <AdditionalResourceCard
          title="Ports"
          used={usage.allocations}
          limit={resources?.allocations || 0}
          icon="fa-plug"
        />
        
        <AdditionalResourceCard
          title="Backups"
          used={usage.backups}
          limit={resources?.backups || 0}
          icon="fa-archive"
        />
      </div>

      {/* Servers Section */}
      <ServersSection
        servers={servers}
        onDelete={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
