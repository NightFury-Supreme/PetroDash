"use client";

export default function AdminTicketsHeader() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
          <i className="fa-solid fa-ticket text-white"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">Tickets</h1>
          <p className="text-[#CCCCCC] text-base">Manage user tickets</p>
        </div>
      </div>
    </div>
  );
}


