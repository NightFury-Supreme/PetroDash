"use client";

import Link from 'next/link';

export default function UsersTable({ users }: { users: any[] }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left bg-black/20 text-[#AAAAAA]">
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Username</th>
            <th className="p-4 font-medium">Role</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Servers</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t border-[var(--border)] hover:bg-[var(--hover)] transition-colors">
              <td className="p-4">{u.email}</td>
              <td className="p-4 font-medium text-white">{u.username}</td>
              <td className="p-4">
                <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                  u.role === 'admin' 
                    ? 'bg-red-600/20 text-red-300 border-red-700/50' 
                    : 'bg-green-600/20 text-green-300 border-green-700/50'
                }`}>
                  {u.role === 'admin' ? 'admin' : 'user'}
                </span>
              </td>
              <td className="p-4">
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
              <td className="p-4 font-medium">{u.serverCount}</td>
              <td className="p-4 text-right">
                <Link href={`/admin/users/${u._id}`} className="px-4 py-2 rounded-lg text-xs font-medium bg-white text-black hover:bg-gray-200 transition-colors">Manage</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


