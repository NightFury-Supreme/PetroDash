"use client";

import { FormData, Violations } from './types';

interface NameStepProps {
  form: FormData;
  violations: Violations;
  onInputChange: (field: keyof FormData, value: string) => void;
}

export function NameStep({ form, violations, onInputChange }: NameStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Server Details</h2>
        <p className="text-[#AAAAAA] text-sm">Configure your server's basic information</p>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">
          Server Name <span className="text-red-400">*</span>
        </label>
        <input 
          type="text"
          className={`w-full bg-[#181818] border rounded-lg p-3 text-white focus:outline-none transition-colors ${
            violations.name ? 'border-red-500' : 'border-[#303030] focus:border-white'
          }`}
          value={form.name} 
          onChange={(e) => onInputChange('name', e.target.value)} 
          placeholder="Enter server name"
          required
        />
        {violations.name && (
          <div className="text-xs text-red-400">{violations.name}</div>
        )}
      </div>
    </div>
  );
}
