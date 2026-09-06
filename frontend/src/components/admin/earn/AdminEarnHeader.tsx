"use client";

export function AdminEarnHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Earn <span className="text-[#FF5722]">Manager</span></h1>
        <p className="text-[#888888] mt-1 text-sm">Configure coin earning methods and rewards.</p>
      </div>
    </div>
  );
}
