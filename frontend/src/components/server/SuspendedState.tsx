import { ReactNode } from 'react';

interface SuspendedStateProps {
  serverId: string;
  subtitle?: string;
  action: ReactNode;
}

export function SuspendedState({ serverId, subtitle, action }: SuspendedStateProps) {
  return (
    <div className="p-6">
      <div className="text-center py-16 space-y-6">
        <div className="w-24 h-24 mx-auto bg-[#1a1a1a] rounded-full flex items-center justify-center">
          <i className="fas fa-pause-circle text-[#AAAAAA] text-3xl" />
        </div>
        <div className="space-y-4 max-w-lg mx-auto text-center">
          <h3 className="text-2xl font-bold text-white">Server Suspended</h3>
          <p className="text-[#AAAAAA]">
            {subtitle ?? 'This server is suspended and cannot be edited. Contact admin for assistance.'}
          </p>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-left">
            <div className="text-[#AAAAAA] text-sm mb-2">Server ID for Support:</div>
            <div className="text-white font-mono text-sm break-all">{serverId}</div>
          </div>
        </div>
        <div className="flex justify-center">{action}</div>
      </div>
    </div>
  );
}
