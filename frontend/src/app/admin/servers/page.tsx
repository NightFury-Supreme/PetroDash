"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useModal } from '@/components/Modal';
import Shell from '@/components/Shell';
import ServerCard from '@/components/ServerCard/ServerCard';
import ServersHeader from '@/components/admin/servers/ServersHeader';
import ServersGrid from '@/components/admin/servers/ServersGrid';
import AdminServersSkeleton from '@/components/skeletons/admin/servers/AdminServersSkeleton';

type Server = {
  _id: string;
  name: string;
  status: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  egg: {
    _id: string;
    name: string;
  };
  location: {
    _id: string;
    name: string;
  };
  limits: {
    diskMb: number;
    memoryMb: number;
    cpuPercent: number;
    backups: number;
    databases: number;
    allocations: number;
  };
  createdAt: string;
};

export default function AdminServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const modal = useModal();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load servers');
      }

      const data = await response.json();
      setServers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteServer = async (serverId: string, serverName: string) => {
    const confirmed = await modal.confirm({
      title: 'Delete Server',
      body: `Are you sure you want to delete "${serverName}"? This action cannot be undone and will remove the server from both the panel and database.`,
      confirmText: 'Delete'
    });

    if (!confirmed) return;

    setDeleting(serverId);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/servers/${serverId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete server');
      }

      await modal.success({
        title: 'Server Deleted',
        body: `Server "${serverName}" has been deleted successfully.`
      });

      setServers(servers.filter(s => s._id !== serverId));
    } catch (err: any) {
      await modal.error({
        title: 'Error',
        body: err.message
      });
    } finally {
      setDeleting(null);
    }
  };



  if (loading) {
    return (
      <Shell>
        <AdminServersSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <ServersHeader total={servers.length} />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <div className="flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-xl"></i>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Servers Grid */}
        {servers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 icon-gradient rounded-full flex items-center justify-center shadow-glow">
              <i className="fas fa-server text-white text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3">No servers found</h3>
            <p className="text-muted text-lg">There are no servers created on the platform yet.</p>
          </div>
        ) : (
          <ServersGrid servers={servers} onDelete={deleteServer} deleting={deleting} />
        )}
      </div>
    </Shell>
  );
}
