import React, { useState } from "react";
import { Check, Shield, User } from "lucide-react";
import { SelectDropdown, SelectDropdownOption } from "@/components/ui";

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
  const [roleSaved, setRoleSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newRole: string) => {
    if (newRole === currentRole || loading) return;
    setLoading(true);
    setRoleSaved(false);
    try {
      await onRoleChange(newRole);
      setRoleSaved(true);
      setTimeout(() => setRoleSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const options: SelectDropdownOption[] = [
    {
      value: "user",
      label: (
        <>
          <User size={14} className="text-emerald-400 shrink-0" />
          <span>{roleUserLabel}</span>
        </>
      ),
    },
    {
      value: "admin",
      label: (
        <>
          <Shield size={14} className="text-[#FF5722] shrink-0" />
          <span>{roleAdminLabel}</span>
        </>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-2.5 w-full justify-end">
      {roleSaved && !loading && (
        <span className="text-emerald-400 shrink-0 flex items-center gap-1 text-[11px] animate-in fade-in duration-200">
          <Check size={12} strokeWidth={3} /> {doneLabel}
        </span>
      )}
      <SelectDropdown
        value={currentRole || "user"}
        options={options}
        onChange={handleChange}
        loading={loading}
        disabled={loading}
        className="w-full max-w-[200px]"
      />
    </div>
  );
}
