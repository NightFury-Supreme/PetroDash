"use client";

import React from "react";
import TicketItem from "./TicketItem";

export default function TicketList({ tickets, onRefresh }:{ tickets: any[], onRefresh?: () => void }){
  if (!tickets || tickets.length === 0) {
    return <div className="text-[#AAAAAA]">No tickets found.</div>;
  }
  return (
    <div className="space-y-3">
      {tickets.map(t => (<TicketItem key={t._id} ticket={t} onRefresh={onRefresh} />))}
    </div>
  );
}


