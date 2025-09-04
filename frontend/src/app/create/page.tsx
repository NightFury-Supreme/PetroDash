"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateServerForm } from '../../components/create/CreateServerForm';
import { CreateServerSkeleton } from '../../components/Skeleton';
import Shell from '../../components/Shell';
import { Egg, Location, ResourceLimits } from '../../components/create/types';

interface ResourceUsage {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
  servers: number;
}

export default function CreateServerPage() {
  const router = useRouter();
  // State
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [resources, setResources] = useState<ResourceLimits | null>(null);
  const [usage, setUsage] = useState<ResourceUsage>({
    diskMb: 0,
    memoryMb: 0,
    cpuPercent: 0,
    backups: 0,
    databases: 0,
    allocations: 0,
    servers: 0
  });

  // Load create page data
  const loadCreatePageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch data in parallel
      const [eggsResponse, locationsResponse, limitsResponse, usageResponse, plansResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/eggs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/locations`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers/usage`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/user/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!eggsResponse.ok || !locationsResponse.ok || !limitsResponse.ok || !usageResponse.ok || !plansResponse.ok) {
        throw new Error('Failed to load create page data');
      }

      const [eggsData, locationsData, userData, usageData, plansData] = await Promise.all([
        eggsResponse.json(),
        locationsResponse.json(),
        limitsResponse.json(),
        usageResponse.json(),
        plansResponse.json()
      ]);

      const eggsWithData = eggsData || [];
      const locationsWithData = locationsData || [];

      // Collect plan tokens (both names and ids) from /api/user/plans
      const planTokens: Set<string> = new Set(
        Array.isArray(plansData)
          ? plansData.flatMap((p: any) => [
              p?.planId?.name,
              p?.planId?._id,
              p?.planId,
            ]).filter(Boolean)
          : []
      );

      // Filter by allowedPlans if configured
      const eggsFilteredRaw = eggsWithData.map((e: any) => ({
        ...e,
        // If API already computed isPlanAllowed, trust it; otherwise compute using tokens (names + ids)
        isPlanAllowed: typeof e.isPlanAllowed === 'boolean'
          ? e.isPlanAllowed
          : (!Array.isArray(e.allowedPlans) || e.allowedPlans.length === 0 || e.allowedPlans.some((ap: string) => planTokens.has(String(ap))))
      }));
      const locationsFilteredRaw = locationsWithData.map((l: any) => ({
        ...l,
        isPlanAllowed: typeof l.isPlanAllowed === 'boolean'
          ? l.isPlanAllowed
          : (!Array.isArray(l.allowedPlans) || l.allowedPlans.length === 0 || l.allowedPlans.some((ap: string) => planTokens.has(String(ap))))
      }));

      const eggsFiltered = eggsFilteredRaw; // keep all but mark isPlanAllowed for UI
      const locationsFiltered = locationsFilteredRaw; // keep all but mark isPlanAllowed for UI

      setEggs(eggsFiltered);
      setLocations(locationsFiltered);
      setResources(userData.resources);
      setUsage(usageData);

    } catch (err: any) {
      console.error('Error loading create page data:', err);
      setError(err.message || 'Failed to load create page data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    setMounted(true);
    loadCreatePageData();
  }, []);

  // Loading state
  if (!mounted || loading) {
    return <CreateServerSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Shell>
        <div className="p-6 bg-[#0F0F0F] min-h-screen">
          <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Create Page</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadCreatePageData}
              className="bg-[#303030] hover:bg-[#404040] text-white px-6 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // Calculate remaining resources
  const remaining: ResourceLimits = (resources && usage) ? {
    diskMb: Math.max(0, resources.diskMb - (usage.diskMb || 0)),
    memoryMb: Math.max(0, resources.memoryMb - (usage.memoryMb || 0)),
    cpuPercent: Math.max(0, resources.cpuPercent - (usage.cpuPercent || 0)),
    backups: Math.max(0, resources.backups - (usage.backups || 0)),
    databases: Math.max(0, resources.databases - (usage.databases || 0)),
    allocations: Math.max(0, resources.allocations - (usage.allocations || 0)),
    serverSlots: Math.max(0, resources.serverSlots - (usage.servers || 0))
  } : {
    diskMb: 0,
    memoryMb: 0,
    cpuPercent: 0,
    backups: 0,
    databases: 0,
    allocations: 0,
    serverSlots: 0
  };

  

  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-plus text-white text-lg sm:text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Create Server
            </h1>
            <p className="text-[#AAAAAA] text-base sm:text-lg">Deploy a new server instance</p>
          </div>
        </header>

        {/* Create Server Form */}
        <CreateServerForm 
          eggs={eggs}
          locations={locations}
          remaining={remaining}
        />
      </div>
    </Shell>
  );
}


