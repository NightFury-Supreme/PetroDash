"use client";

import Link from 'next/link';

export default function EggsHeader({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
          <i className="fas fa-egg text-white text-lg sm:text-2xl"></i>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Eggs</h1>
          <p className="text-[#AAAAAA] text-base sm:text-lg">Manage server templates and environments</p>
        </div>
      </div>
      <Link href="/admin/eggs/new" className="px-4 py-2 rounded-md bg-white text-black border border-[var(--border)]">New Egg</Link>
    </div>
  );
}


