import React from 'react';

type UnreachableServerCardProps = {
  serverId: string;
  serverName: string;
  className?: string;
};

export default function UnreachableServerCard({
  serverId,
  serverName,
  className = ""
}: UnreachableServerCardProps) {
  return (
    <div className={`bg-[#202020] border border-[#303030] rounded-2xl p-6 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white truncate">{serverName}</h3>
      </div>
      
      {/* Unreachable Status */}
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#1a1a1a] rounded-full flex items-center justify-center">
          <i className="fas fa-exclamation-triangle text-[#AAAAAA] text-2xl"></i>
        </div>
        <h4 className="text-[#AAAAAA] font-medium mb-2">Server Unreachable</h4>
        <p className="text-[#AAAAAA] text-sm mb-4">This server is unreachable, Contact admin for assistance</p>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
          <p className="text-white font-mono text-sm">Server ID: {serverId}</p>
        </div>
      </div>
    </div>
  );
}