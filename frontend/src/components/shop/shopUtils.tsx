import { Archive, Box, Cpu, Database, HardDrive, MemoryStick, Network, Zap } from "lucide-react";

export const MAX_QUANTITY = 100;

/** Map an item name to a Lucide icon component */
export function getShopIcon(name: string = "") {
  const n = name.toLowerCase();
  if (n.includes("cpu")) return Cpu;
  if (n.includes("ram") || n.includes("memory")) return MemoryStick;
  if (n.includes("disk") || n.includes("storage")) return HardDrive;
  if (n.includes("port") || n.includes("network") || n.includes("alloc")) return Network;
  if (n.includes("backup")) return Archive;
  if (n.includes("database") || n.includes("db")) return Database;
  if (n.includes("server") || n.includes("slot")) return Box;
  return Zap;
}

/** Format "+N unit" for the order summary */
export function getTotalAmount(item: any, quantity: number): string {
  const value = Number(item.amountPerUnit || "1") * quantity;
  return `+${value.toLocaleString()} ${item.unit || "units"}`;
}

/* -- Shared tiny UI atoms ------------------------------------------- */

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#555]">
      {children}
    </span>
  );
}

export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-0.5 text-xs text-[#666]">{description}</p>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[#666]">{label}</span>
      <span className="text-[13px] font-semibold text-white">{value}</span>
    </div>
  );
}
