import React from 'react';
import { ServerInfo } from '../dashboard/types';

interface SuspendedServerCardProps {
  server: ServerInfo;
}

const SuspendedServerCard: React.FC<SuspendedServerCardProps> = ({ server }) => {
  const serverId = server._id;

  return (
    <div className="bg-[#202020] border border-[#303030] rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white truncate">{server.name}</h3>
      </div>
      
      {/* Suspended Status */}
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#1a1a1a] rounded-full flex items-center justify-center">
          <i className="fas fa-pause-circle text-[#AAAAAA] text-2xl"></i>
        </div>
        <h4 className="text-[#AAAAAA] font-medium mb-2">Server Suspended</h4>
        <p className="text-[#AAAAAA] text-sm mb-4">This server has been suspended, Contact admin for assistance</p>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
          <p className="text-white font-mono text-sm">Server ID: {serverId}</p>
        </div>
      </div>
    </div>
  );
};

export default SuspendedServerCard;
