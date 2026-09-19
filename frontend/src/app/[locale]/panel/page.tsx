"use client";

import React from "react";
import { PanelContent } from "@/components/panel";

export default function ControlPanelPage() {
  return (
    <div className="p-4 sm:p-6 flex flex-col bg-[#0F0F0F] min-h-screen text-[#E0E0E0]">
      <PanelContent />
    </div>
  );
}
