import { useState, useEffect, useCallback } from 'react';
import { ServerInfo, ResourceLimits, ResourceUsage } from '../components/dashboard/types';

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [usage, setUsage] = useState<ResourceUsage>({
    diskMb: 0,
    memoryMb: 0,
    cpuPercent: 0,
    backups: 0,
    databases: 0,
    allocations: 0,
    servers: 0
  });
  const [resources, setResources] = useState<ResourceLimits | null>(null);

  // Load resource usage
  const loadUsage = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to load usage data');
      }
      
      const data = await response.json();
      setUsage({
        diskMb: Number(data.diskMb || 0),
        memoryMb: Number(data.memoryMb || 0),
        cpuPercent: Number(data.cpuPercent || 0),
        backups: Number(data.backups || 0),
        databases: Number(data.databases || 0),
        allocations: Number(data.allocations || 0),
        servers: Number(data.servers || 0)
      });
    } catch (error: unknown) {
      console.error('Failed to load usage:', error);
      throw error;
    }
  };

  // Load user resources
  const loadResources = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to load user resources');
      }
      
      const data = await response.json();
      setResources(data.resources || null);
    } catch (error: unknown) {
      console.error('Failed to load resources:', error);
      // Don't throw here, resources are not critical
    }
  };

  // Load servers
  const loadServers = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to load servers');
      }
      
      const data = await response.json();
      const transformed: ServerInfo[] = (data || []).map((s: any) => ({
        _id: s._id,
        name: s.name,
        status: s.status === 'active' ? 'active' : s.status === 'creating' ? 'creating' : s.status === 'unreachable' ? 'unreachable' : s.status === 'suspended' ? 'suspended' : 'error',
        location: s.locationId?.name || 'Unknown',
        cpu: Number(s.limits?.cpuPercent || 0),
        memory: Number(s.limits?.memoryMb || 0),
        storage: Number(s.limits?.diskMb || 0),
        url: s.clientUrl || '#',
        eggName: s.eggId?.name || undefined,
        eggIcon: s.eggId?.icon || undefined,
        backups: Number(s.limits?.backups || 0),
        databases: Number(s.limits?.databases || 0),
        allocations: Number(s.limits?.allocations || 1),
        unreachable: s.unreachable || false,
        error: s.error || undefined,
        suspended: s.suspended || false,
      }));
      
      setServers(transformed);
    } catch (error: unknown) {
      console.error('Failed to load servers:', error);
      throw error;
    }
  };

  // Load all dashboard data with useCallback to prevent infinite loops
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Load usage and resources
      await Promise.all([
        loadUsage(token),
        loadResources(token),
        loadServers(token)
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we don't depend on any props or state

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Remove server from state after deletion
  const removeServer = useCallback((serverId: string) => {
    setServers(prev => prev.filter(s => s._id !== serverId));
    setUsage(prev => ({
      ...prev,
      servers: Math.max(0, prev.servers - 1)
    }));
  }, []);

  return {
    loading,
    error,
    servers,
    usage,
    resources,
    loadDashboardData,
    removeServer
  };
}
