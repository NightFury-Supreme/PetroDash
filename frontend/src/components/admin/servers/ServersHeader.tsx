"use client";

export default function ServersHeader({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
          <i className="fas fa-server text-white text-lg sm:text-2xl"></i>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Servers</h1>
          <p className="text-[#AAAAAA] text-base sm:text-lg">Monitor and manage all servers</p>
        </div>
      </div>
      <div className="hidden sm:block text-right">
        <div className="text-2xl font-bold text-white">{total}</div>
        <div className="text-sm text-[#AAAAAA]">Total Servers</div>
      </div>
    </div>
  );
}


