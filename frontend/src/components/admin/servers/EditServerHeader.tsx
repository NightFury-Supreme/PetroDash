"use client";

import Link from 'next/link';

export default function EditServerHeader() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <Link href="/admin/servers" className="btn-ghost p-2">
        <i className="fas fa-arrow-left"></i>
      </Link>
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
        <i className="fas fa-server text-white text-lg sm:text-2xl"></i>
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Edit Server</h1>
        <p className="text-[#AAAAAA] text-base sm:text-lg">Update server resources and configuration</p>
      </div>
    </div>
  );
}


