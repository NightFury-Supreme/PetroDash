import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";

interface RoleSelectDropdownProps {
  currentRole: string;
  onRoleChange: (newRole: string) => Promise<void>;
  roleUserLabel: string;
  roleAdminLabel: string;
  doneLabel: string;
}

export function RoleSelectDropdown({
  currentRole,
  onRoleChange,
  roleUserLabel,
  roleAdminLabel,
  doneLabel,
}: RoleSelectDropdownProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSaved, setRoleSaved] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = async (newRole: string) => {
    if (newRole === currentRole) {
      setRoleDropdownOpen(false);
      return;
    }
    setRoleLoading(true);
    setRoleSaved(false);
    try {
      await onRoleChange(newRole);
      setRoleSaved(true);
      setTimeout(() => setRoleSaved(false), 2000);
    } finally {
      setRoleLoading(false);
      setRoleDropdownOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !roleLoading && setRoleDropdownOpen(!roleDropdownOpen)}
          disabled={roleLoading}
          className={`h-8 w-32 flex items-center justify-between gap-[7px] px-3 border rounded-md text-sm transition-colors disabled:opacity-50 outline-none
            ${
              roleDropdownOpen
                ? 'bg-[#222] border-[#222] text-[#ddd]'
                : 'bg-[#101010] border-[#2A2A2A] text-[#D4D4D4] hover:border-[#FF5722]/50 hover:text-[#ddd]'
            }
          `}
        >
          <span className="capitalize">{currentRole || 'user'}</span>
          <ChevronDown size={14} className="text-[#858585]" />
        </button>

        {roleDropdownOpen && (
          <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-full border border-[#2A2A2A] rounded-md bg-[#151515] p-1.5 shadow-xl">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleChange('user')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors
                  ${
                    currentRole !== 'admin'
                      ? 'text-[#ff5722] bg-[#FF5722]/10'
                      : 'text-[#888] hover:bg-[#222] hover:text-[#ddd]'
                  }
                `}
              >
                {roleUserLabel}
                {currentRole !== 'admin' && <Check size={14} />}
              </button>
              <button
                type="button"
                onClick={() => handleChange('admin')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors
                  ${
                    currentRole === 'admin'
                      ? 'text-[#ff5722] bg-[#FF5722]/10'
                      : 'text-[#888] hover:bg-[#222] hover:text-[#ddd]'
                  }
                `}
              >
                {roleAdminLabel}
                {currentRole === 'admin' && <Check size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>
      {roleLoading && <Loader2 size={14} className="animate-spin shrink-0 text-white/50" />}
      {roleSaved && (
        <span className="text-emerald-400 shrink-0 flex items-center gap-1 text-[11px]">
          <Check size={12} strokeWidth={3} /> {doneLabel}
        </span>
      )}
    </div>
  );
}
