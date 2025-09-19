"use client";
import Shell from '@/components/Shell';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminUsersSkeleton from '@/components/skeletons/admin/user/AdminUsersSkeleton';
import UsersHeader from '@/components/admin/users/UsersHeader';
import UsersTable from '@/components/admin/users/UsersTable';

export default function AdminUsersListPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users`);
    if (search.trim()) url.searchParams.set('search', search.trim());
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed'); return d; })
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  if (loading) {
    return (
      <Shell>
        <AdminUsersSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <UsersHeader />

        <div>
          <input
            value={search}
            onChange={(e) => { setLoading(true); setSearch(e.target.value); }}
            placeholder="Search by email, username, or ID"
            className="w-full max-w-md px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A]"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <UsersTable users={users} />
      </div>
    </Shell>
  );
}


