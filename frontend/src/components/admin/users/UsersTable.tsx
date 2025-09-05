"use client";

import Link from 'next/link';

export default function UsersTable({ users }: { users: any[] }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <th className="p-3">Email</th>
            <th className="p-3">Username</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3">Servers</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t" style={{ borderColor: 'var(--border)' }}>
              <td className="p-3">{u.email}</td>
              <td className="p-3">{u.username}</td>
              <td className="p-3">
                <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                  u.role === 'admin' 
                    ? 'bg-red-600/20 text-red-300 border-red-700/50' 
                    : 'bg-green-600/20 text-green-300 border-green-700/50'
                }`}>
                  {u.role === 'admin' ? 'admin' : 'user'}
                </span>
              </td>
              <td className="p-3">
                {u.ban?.isBanned ? (
                  <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                    <i className="fas fa-ban text-xs"></i>
                    Banned
                  </span>
                ) : (
                  <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                    <i className="fas fa-check-circle text-xs"></i>
                    Active
                  </span>
                )}
              </td>
              <td className="p-3">{u.serverCount}</td>
              <td className="p-3 text-right">
                <Link href={`/admin/users/${u._id}`} className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black border border-[var(--border)]">Manage</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


