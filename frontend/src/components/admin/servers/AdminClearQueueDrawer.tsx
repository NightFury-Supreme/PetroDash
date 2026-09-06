"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, X, ChevronDown } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";

function SimpleDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[#666] text-[10px] font-semibold uppercase tracking-[0.05em]">{label}</label>
      <div className="relative w-full">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 appearance-none rounded-md bg-[#161616] border border-[#2A2A2A] px-3 text-xs text-[#D4D4D4] outline-none focus:border-red-500/50 transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none" />
      </div>
    </div>
  );
}

interface AdminClearQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (locationId: string, eggId: string) => Promise<void>;
  locations: { _id: string; name: string }[];
  eggs: { _id: string; name: string }[];
}

export function AdminClearQueueDrawer({
  isOpen,
  onClose,
  onConfirm,
  locations,
  eggs,
}: AdminClearQueueDrawerProps) {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedEgg, setSelectedEgg] = useState("all");
  const [confirmText, setConfirmText] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  // Reset state when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setSelectedLocation("all");
      setSelectedEgg("all");
      setIsClearing(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (confirmText.trim().toLowerCase() !== "clear") return;
    setIsClearing(true);
    try {
      await onConfirm(selectedLocation, selectedEgg);
      onClose();
    } catch (err) {
      console.error(err);
      setIsClearing(false);
    }
  };

  const isConfirmDisabled = confirmText.trim().toLowerCase() !== "clear";
  const isFiltering = selectedLocation !== "all" || selectedEgg !== "all";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Clear Queue"
      subtitle="Remove servers from the queue based on the criteria below."
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-[#222] bg-transparent px-5 py-2.5 text-sm font-medium text-[#888] transition-colors hover:border-[#333] hover:text-white"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isClearing}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              isConfirmDisabled || isClearing
                ? "bg-[#111] text-[#555] cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600 shadow-sm"
            }`}
          >
            {isClearing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <X size={16} />
            )}
            Clear Queue
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 mb-8">
        <SimpleDropdown
          label="Target Node"
          value={selectedLocation}
          onChange={setSelectedLocation}
          options={[
            { label: "All Nodes", value: "all" },
            ...locations.map((loc) => ({ label: loc.name, value: loc._id })),
          ]}
        />
        
        <SimpleDropdown
          label="Target Egg"
          value={selectedEgg}
          onChange={setSelectedEgg}
          options={[
            { label: "All Eggs", value: "all" },
            ...eggs.map((egg) => ({ label: egg.name, value: egg._id })),
          ]}
        />
      </div>

      <div className="border-l-2 border-red-500 pl-5 py-1 mb-10">
        <div className="flex items-center gap-2 text-red-500 mb-4">
          <AlertTriangle size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">BEFORE YOU CONTINUE</span>
        </div>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-500"></span>
            <span>
              {isFiltering
                ? "This will remove all queue servers matching your selected Node and/or Egg permanently."
                : "This will remove ALL servers from the queue permanently for ALL users."}
            </span>
          </li>
          <li className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-500"></span>
            <span>Users will need to recreate these servers manually.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-500"></span>
            <span>This action cannot be undone.</span>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 mb-4">
          Type <span className="text-zinc-100">CLEAR</span> to confirm
        </h2>
        <div className="flex overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616] focus-within:border-red-500/50 transition-colors">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="CLEAR"
            className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[13px] text-white outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>
    </Drawer>
  );
}
