"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Activity } from 'lucide-react';
import { useToast } from "@/components/ui/ToastProvider";

interface StatusHistory {
  date: string;
  status: string;
  uptime: number;
  downtimeMinutes?: number;
}

interface StatusNode {
  id: string;
  name: string;
  region: string;
  status: string;
  uptime: number;
  ping: number | null;
  history: StatusHistory[];
}

interface StatusData {
  globalUptime: number;
  panel: {
    status: string;
    uptime: number;
    ping: number | null;
    history: StatusHistory[];
  };
  nodes: StatusNode[];
}

const UptimeBars = ({ history, uptime }: { history: StatusHistory[], uptime: number }) => {
  const [hoverData, setHoverData] = useState<{ day: StatusHistory, rect: DOMRect } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const filledHistory = history || [];
  
  return (
    <div className="mt-1">
      <div className="flex items-center gap-[2px] w-full h-6">
        {filledHistory.map((day, i) => {
          let bgColor = "bg-[#10b981]"; // green
          if (day.status === "Major Outage") bgColor = "bg-[#ef4444]";
          else if (day.status === "Partial Outage") bgColor = "bg-[#f59e0b]";
          else if (day.status === "Degraded") bgColor = "bg-[#fcd34d]";
          else if (day.status === "No Data") bgColor = "bg-[#2a2a2a]";

          return (
            <div
              key={i}
              onMouseEnter={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setHoverData({ day, rect });
              }}
              onMouseLeave={() => setHoverData(null)}
              className={`flex-1 h-full rounded-[1px] ${bgColor} transition-all duration-150 cursor-pointer hover:brightness-150 hover:scale-y-110 origin-bottom`}
            />
          );
        })}
      </div>
      
      {mounted && hoverData && createPortal(
        <div 
          className="fixed z-[10000] pointer-events-none transform -translate-x-1/2 -translate-y-full pb-2"
          style={{ 
            left: hoverData.rect.left + hoverData.rect.width / 2, 
            top: hoverData.rect.top 
          }}
        >
          <div className="w-max bg-[#1a1a1a] border border-[#2a2a2a] text-[#E0E0E0] text-xs rounded p-3 relative">
            <div className="font-medium text-[#AAAAAA] mb-2">{hoverData.day.date}</div>
            {hoverData.day.status === "No Data" ? (
              <div className="text-[#888888]">No data recorded for this day.</div>
            ) : hoverData.day.uptime >= 100 ? (
              <div className="text-[#888888]">No downtime recorded on this day.</div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <i className={`fas fa-${hoverData.day.status === 'Major Outage' ? 'times text-[#ef4444]' : 'exclamation-triangle text-[#f59e0b]'}`}></i>
                  <span className="font-medium text-[#E0E0E0]">{hoverData.day.status}</span>
                </div>
                <span className="text-[#888888]">
                  {hoverData.day.downtimeMinutes !== undefined && hoverData.day.downtimeMinutes > 0 ? (
                    (() => {
                      const hrs = Math.floor(hoverData.day.downtimeMinutes / 60);
                      const mins = Math.round(hoverData.day.downtimeMinutes % 60);
                      return hrs > 0 ? `${hrs} hrs ${mins} mins` : `${mins} mins`;
                    })()
                  ) : ''}
                </span>
              </div>
            )}
            {/* Tooltip arrow pointing down */}
            <div className="absolute -bottom-[5px] left-1/2 transform -translate-x-1/2 rotate-45 w-2.5 h-2.5 bg-[#1a1a1a] border-r border-b border-[#2a2a2a]"></div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex items-center justify-between h-4 mt-2 text-[11px]">
        <div className="flex items-center gap-2 w-full text-[#666666]">
          <span>90 days ago</span>
          <div className="flex-1 h-[1px] bg-[#333]"></div>
          <span className="text-[#888] font-medium">{uptime.toFixed(2)} % uptime</span>
          <div className="flex-1 h-[1px] bg-[#333]"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ 
  name, 
  status, 
  history, 
  ping,
  uptime
}: { 
  name: string; 
  status: string; 
  history: StatusHistory[]; 
  ping?: number | null;
  uptime: number;
}) => {
  let statusColor = "text-[#10b981]";
  if (status === "Major Outage") statusColor = "text-[#ef4444]";
  else if (status === "Partial Outage") statusColor = "text-[#f59e0b]";
  else if (status === "Degraded") statusColor = "text-[#fcd34d]";

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2 text-[#E0E0E0] font-medium">
          {name}
        </div>
        <div className="flex items-center gap-3">
          {ping !== undefined && ping !== null && (
            <span className="text-[#888] hidden sm:inline-block">{ping}ms</span>
          )}
          <span className={`font-bold ${statusColor}`}>{status}</span>
        </div>
      </div>
      <UptimeBars history={history} uptime={uptime} />
    </div>
  );
};

export function DashboardStatus() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/status`);
        if (!res.ok) throw new Error('Failed to fetch status');
        const jsonData = await res.json();
        if (isMounted) setData(jsonData);
      } catch (err: any) {
        if (isMounted) showError(err.message || 'Failed to fetch status');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showError]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-6">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-2 text-[#888888]">
          <Activity size={16} />
          <span className="font-medium text-sm tracking-wide text-white">System Status</span>
        </div>
        
        {data && (
          (() => {
            let overallStatus = "All systems normal.";
            let bannerClasses = "bg-[#10b981]/10 text-[#10b981]";
            let dotClass = "bg-[#10b981]";

            const allStatuses = [data.panel.status, ...data.nodes.map((n: any) => n.status)];
            if (allStatuses.some((s: string) => s === "Major Outage")) {
              overallStatus = "Major system outage.";
              bannerClasses = "bg-[#ef4444]/10 text-[#ef4444]";
              dotClass = "bg-[#ef4444]";
            } else if (allStatuses.some((s: string) => s === "Partial Outage" || s === "Degraded")) {
              overallStatus = "Some systems experiencing issues.";
              bannerClasses = "bg-[#f59e0b]/10 text-[#f59e0b]";
              dotClass = "bg-[#f59e0b]";
            }

            return (
              <div className={`flex items-center gap-2 border border-[#222] rounded-md px-2 py-1 text-xs ${bannerClasses}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                {overallStatus}
              </div>
            );
          })()
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex-1 space-y-6 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-6 last:mb-0">
                <div className="flex justify-between mb-2">
                  <div className="w-24 h-4 bg-[#222] rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-[#222] rounded animate-pulse"></div>
                </div>
                <div className="w-full h-6 bg-[#222] rounded animate-pulse mb-2"></div>
                <div className="flex justify-between items-center">
                  <div className="w-16 h-3 bg-[#222] rounded animate-pulse"></div>
                  <div className="flex-1 h-[1px] bg-[#222] mx-2"></div>
                  <div className="w-20 h-3 bg-[#222] rounded animate-pulse"></div>
                  <div className="flex-1 h-[1px] bg-[#222] mx-2"></div>
                  <div className="w-12 h-3 bg-[#222] rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            <StatusCard 
              name="Panel" 
              status={data.panel.status} 
              history={data.panel.history} 
              ping={data.panel.ping} 
              uptime={data.panel.uptime}
            />
            {data.nodes.map(node => (
              <StatusCard 
                key={node.id} 
                name={node.name} 
                status={node.status} 
                history={node.history} 
                ping={node.ping} 
                uptime={node.uptime}
              />
            ))}
            {data.nodes.length === 0 && (
              <div className="text-[#888] text-xs text-center py-4">No nodes configured</div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
