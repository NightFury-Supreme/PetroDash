"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import React from 'react';
import { AdminStatsSkeleton } from '@/components/skeletons/admin/AdminStatsSkeleton';

function decodeJwt(token: string): { userId?: string; username?: string; role?: string } | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(Array.prototype.map.call(json, (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
  } catch (_) {
    try {
      const [, payload] = token.split('.');
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  type AdminStats = {
    users: { total: number; today?: number };
    servers: { total: number; byEgg: Array<{ eggId: string; name?: string; count: number }>; byLocation: Array<{ locationId: string; name?: string; count: number; serverLimit?: number }> };
    eggs: { total: number };
    locations: { total: number };
    plans: { total: number };
    purchases: { total: number; today?: number; usersWithPurchases?: number };
  };
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    const decoded = decodeJwt(t);
    const r = decoded?.role ?? null;
    setRole(r);
    if (r !== 'admin') router.replace('/dashboard');
  }, [router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token || role !== 'admin') return;
      try {
        setLoading(true);
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json() as any;
        if (!r.ok) throw new Error(d?.error || 'Failed to load stats');
        setStats(d as AdminStats);
      } catch (_) {
        setStats(null);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, [token, role]);

  if (!token || role !== 'admin') return null;

  if (loading) {
    return (
      <Shell>
        <AdminStatsSkeleton />
      </Shell>
    );
  }

  const adminFeatures = [
    { title: 'User Management', description: 'List, search, promote/demote, and disable users', icon: 'fas fa-users', color: 'bg-blue-600' },
    { title: 'Pterodactyl Resources', description: 'Overview of users, servers, and nodes', icon: 'fas fa-server', color: 'bg-green-600' },
    { title: 'Audit Logs', description: 'Track API key usage and system activities', icon: 'fas fa-clipboard-list', color: 'bg-purple-600' },
  ];

  return (
    <Shell>
      <div className="space-y-8 p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-cog text-white text-lg sm:text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Admin Panel</h1>
            <p className="text-[#AAAAAA] text-base sm:text-lg">System administration and management</p>
          </div>
        </div>

        <div className="p-8 rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#202020] rounded-xl flex items-center justify-center">
              <i className="fas fa-shield-alt text-white"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">Administrator Console</h2>
              <p className="text-[#AAAAAA]">Welcome to the admin panel</p>
            </div>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats ? (
              <>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">Total Users</div>
                    <i className="fas fa-users text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.users.total}</div>
                </div>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">New Users Today</div>
                    <i className="fas fa-user-plus text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.users.today}</div>
                </div>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">Servers</div>
                    <i className="fas fa-server text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.servers.total}</div>
                </div>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">Eggs</div>
                    <i className="fas fa-egg text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.eggs.total}</div>
                </div>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">Locations</div>
                    <i className="fas fa-map-marker-alt text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.locations.total}</div>
                </div>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">Plans</div>
                    <i className="fas fa-tags text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.plans.total}</div>
                </div>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">Plans Bought</div>
                    <i className="fas fa-shopping-cart text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.purchases.total}</div>
                </div>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">Plans Bought Today</div>
                    <i className="fas fa-chart-line text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.purchases.today}</div>
                </div>
                <div className="p-6 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-[#AAAAAA]">Users Who Bought</div>
                    <i className="fas fa-user-check text-[#8A8A8A]"></i>
                  </div>
                  <div className="text-2xl font-bold">{stats.purchases.usersWithPurchases}</div>
                </div>
              </>
            ) : (
              <div className="md:col-span-3 text-sm text-red-400">Failed to load stats</div>
            )}
          </div>

          {/* Breakdown tables */}
          {!loading && stats && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <h3 className="font-semibold mb-4">Servers by Egg</h3>
                <div className="space-y-2">
                  {stats.servers.byEgg.map((e: any) => (
                    <div key={e.eggId} className="flex items-center justify-between text-sm">
                      <span className="text-[#AAAAAA]">{e.name || e.eggId}</span>
                      <span className="font-semibold">{e.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <h3 className="font-semibold mb-4">Servers by Location</h3>
                <div className="space-y-2">
                  {stats.servers.byLocation.map((l: any) => (
                    <div key={l.locationId} className="flex items-center justify-between text-sm">
                      <span className="text-[#AAAAAA]">{l.name || l.locationId}</span>
                      <span className="font-semibold">{l.count} / {l.serverLimit ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}


