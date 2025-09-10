"use client";

import React from "react";

export default function TicketsHeader({ title, subtitle, onNew }: { title: string; subtitle: string; onNew: () => void; }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
          <i className="fa-solid fa-ticket text-white"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">{title}</h1>
          <p className="text-[#CCCCCC] text-base">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onNew} className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
          <i className="fas fa-plus mr-2"></i> New Ticket
        </button>
      </div>
    </div>
  );
}


