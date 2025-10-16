"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/Modal';
import Shell from '@/components/Shell';
import EditServerHeader from '@/components/admin/servers/EditServerHeader';
import ServerLimitsForm from '@/components/admin/servers/ServerLimitsForm';
import AdminEditServerSkeleton from '@/components/skeletons/admin/servers/AdminEditServerSkeleton';
import { SuspendedState } from '@/components/server/SuspendedState';

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
  unreachable?: boolean;
  error?: string;
  suspended?: boolean;
};

export default function EditServerPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;
  const modal = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [server, setServer] = useState<Server | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServer();
  }, [serverId]);

  const loadServer = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load server');
      }

      const serverData = await response.json();
      setServer(serverData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!server) return;
    setServer(prev => prev ? {
      ...prev,
      limits: {
        ...prev.limits,
        [field]: value
      }
    } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/servers/${serverId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          limits: server.limits
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update server');
      }

      await modal.success({ title: 'Success', body: 'Server updated successfully!' });
      router.push('/admin/servers');
    } catch (error: any) {
      await modal.error({ title: 'Error', body: error.message || 'Failed to update server' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <AdminEditServerSkeleton />
      </Shell>
    );
  }

  if (error || !server) {
    return (
      <Shell>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 icon-gradient rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-white text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Server</h3>
            <p className="text-muted mb-4">{error || 'Server not found'}</p>
            <Link href="/admin/servers" className="btn-white">
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Servers
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // Check if server is suspended (from panel or local status)
  if (server?.suspended || server?.status?.toLowerCase() === 'suspended') {
    return (
      <Shell>
        <SuspendedState
          serverId={server._id}
          action={
            <Link
              href="/admin/servers"
              className="btn-white px-8 py-3 text-base font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Servers
            </Link>
          }
        />
      </Shell>
    );
  }

  // Check if server is unreachable
  if (server?.unreachable || server?.status === 'unreachable') {
    return (
      <Shell>
        <div className="p-6">
          <div className="text-center py-16 space-y-6">
            <div className="w-24 h-24 mx-auto bg-[#1a1a1a] rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-[#AAAAAA] text-3xl"></i>
            </div>
            <div className="space-y-4 max-w-lg mx-auto text-center">
              <h3 className="text-2xl font-bold text-white">Server Unreachable</h3>
              <p className="text-[#AAAAAA]">This server is unreachable and cannot be edited. Contact admin for assistance.</p>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-left">
                <div className="text-[#AAAAAA] text-sm mb-1">Server ID for Support:</div>
                <div className="text-white font-mono text-sm break-all">{server._id}</div>
              </div>
            </div>
            <div>
              <Link href="/admin/servers" className="btn-white px-8 py-3 text-base font-semibold hover:bg-gray-100 transition-colors">
                Back to Servers
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 max-w-4xl mx-auto">
        <EditServerHeader />

        {/* Server Info Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="text-xl font-bold mb-4">Server Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Server Name</div>
              <div className="font-medium text-lg">{server.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <div className="font-medium">{server.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Created</div>
              <div className="font-medium">{new Date(server.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Owner</div>
              <div className="font-medium">{server.userId.username}</div>
              <div className="text-sm text-gray-400">{server.userId.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Egg</div>
              <div className="font-medium">{server.egg.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Location</div>
              <div className="font-medium">{server.location.name}</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <ServerLimitsForm limits={server.limits} onChange={handleInputChange} />

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/admin/servers" className="btn-ghost px-8 py-3">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-white px-8 py-3 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}

