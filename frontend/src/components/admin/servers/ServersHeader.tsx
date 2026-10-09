"use client";

export default function ServersHeader({ total: _total }: { total: number }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Servers</h1>
        <p className="text-[#888888] mt-1 text-sm">Monitor and manage all servers on the platform.</p>
      </div>
    </div>
  );
}
