"use client";

import { FormData, Violations, ResourceLimits } from './types';

interface ResourcesStepProps {
  form: FormData;
  violations: Violations;
  remaining: ResourceLimits;
  exceeds: Record<string, boolean>;
  onInputChange: (field: keyof FormData, value: string) => void;
}

export function ResourcesStep({ form, violations, remaining, exceeds, onInputChange }: ResourcesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Server Resources</h2>
        <p className="text-[#AAAAAA] text-sm">Configure your server's resource allocation and limits</p>
      </div>
      
      <form className="space-y-6">
        {/* Resource Limits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Resource Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                CPU (%) <span className="text-red-400">*</span>
                <span className="ml-2 text-xs text-[#AAAAAA]">Remaining: {remaining.cpuPercent}%</span>
              </label>
              <input 
                type="number"
                className={`w-full bg-[#181818] border rounded-lg p-3 text-white focus:outline-none transition-colors ${
                  exceeds.cpuPercent || violations.cpuPercent ? 'border-red-500' : 'border-[#303030] focus:border-white'
                }`}
                value={form.cpuPercent} 
                onChange={(e) => onInputChange('cpuPercent', e.target.value)} 
                min="10"
                max="100"
                required
              />
              {(exceeds.cpuPercent || violations.cpuPercent) && (
                <div className="text-xs text-red-400">
                  {violations.cpuPercent || `Exceeds remaining CPU (${remaining.cpuPercent}%)`}
                </div>
              )}
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Memory (MB) <span className="text-red-400">*</span>
                <span className="ml-2 text-xs text-[#AAAAAA]">Remaining: {remaining.memoryMb} MB</span>
              </label>
              <input 
                type="number"
                className={`w-full bg-[#181818] border rounded-lg p-3 text-white focus:outline-none transition-colors ${
                  exceeds.memoryMb || violations.memoryMb ? 'border-red-500' : 'border-[#303030] focus:border-white'
                }`}
                value={form.memoryMb} 
                onChange={(e) => onInputChange('memoryMb', e.target.value)} 
                min="128"
                required
              />
              {(exceeds.memoryMb || violations.memoryMb) && (
                <div className="text-xs text-red-400">
                  {violations.memoryMb || `Exceeds remaining memory (${remaining.memoryMb} MB)`}
                </div>
              )}
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Disk (MB) <span className="text-red-400">*</span>
                <span className="ml-2 text-xs text-[#AAAAAA]">Remaining: {remaining.diskMb} MB</span>
              </label>
              <input 
                type="number"
                className={`w-full bg-[#181818] border rounded-lg p-3 text-white focus:outline-none transition-colors ${
                  exceeds.diskMb || violations.diskMb ? 'border-red-500' : 'border-[#303030] focus:border-white'
                }`}
                value={form.diskMb} 
                onChange={(e) => onInputChange('diskMb', e.target.value)} 
                min="100"
                required
              />
              {(exceeds.diskMb || violations.diskMb) && (
                <div className="text-xs text-red-400">
                  {violations.diskMb || `Exceeds remaining disk (${remaining.diskMb} MB)`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Additional Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Backups */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Backups
                <span className="ml-2 text-xs text-[#AAAAAA]">Remaining: {remaining.backups}</span>
              </label>
              <input 
                type="number"
                className={`w-full bg-[#181818] border rounded-lg p-3 text-white focus:outline-none transition-colors ${
                  exceeds.backups || violations.backups ? 'border-red-500' : 'border-[#303030] focus:border-white'
                }`}
                value={form.backups} 
                onChange={(e) => onInputChange('backups', e.target.value)} 
                min="0"
              />
              {(exceeds.backups || violations.backups) && (
                <div className="text-xs text-red-400">
                  {violations.backups || `Exceeds remaining backups (${remaining.backups})`}
                </div>
              )}
            </div>

            {/* Databases */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Databases
                <span className="ml-2 text-xs text-[#AAAAAA]">Remaining: {remaining.databases}</span>
              </label>
              <input 
                type="number"
                className={`w-full bg-[#181818] border rounded-lg p-3 text-white focus:outline-none transition-colors ${
                  exceeds.databases || violations.databases ? 'border-red-500' : 'border-[#303030] focus:border-white'
                }`}
                value={form.databases} 
                onChange={(e) => onInputChange('databases', e.target.value)} 
                min="0"
              />
              {(exceeds.databases || violations.databases) && (
                <div className="text-xs text-red-400">
                  {violations.databases || `Exceeds remaining databases (${remaining.databases})`}
                </div>
              )}
            </div>

            {/* Allocations */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Allocations (Ports) <span className="text-red-400">*</span>
                <span className="ml-2 text-xs text-[#AAAAAA]">Remaining: {remaining.allocations}</span>
              </label>
              <input 
                type="number"
                className={`w-full bg-[#181818] border rounded-lg p-3 text-white focus:outline-none transition-colors ${
                  exceeds.allocations || violations.allocations ? 'border-red-500' : 'border-[#303030] focus:border-white'
                }`}
                value={form.allocations} 
                onChange={(e) => onInputChange('allocations', e.target.value)} 
                min="1"
                required
              />
              {(exceeds.allocations || violations.allocations) && (
                <div className="text-xs text-red-400">
                  {violations.allocations || `Exceeds remaining allocations (${remaining.allocations})`}
                </div>
              )}
              {remaining.allocations === 0 && (
                <div className="text-xs text-yellow-400">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  No port allocations remaining. You may need to upgrade your plan or contact support.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Server Slots Warning */}
        {remaining.serverSlots <= 0 && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-red-400"></i>
              <span className="text-red-400 font-medium">No server slots remaining</span>
            </div>
            <p className="text-red-400 text-sm mt-1">
              You have reached your maximum number of servers. Please delete an existing server or upgrade your plan.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
