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

  const handleChange = async (newRole: string) => {
    if (newRole === currentRole) return;
    await onRoleChange(newRole);
    setRoleSaved(true);
    setTimeout(() => setRoleSaved(false), 2000);
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
    <div className="flex items-center gap-3 w-full justify-end">
      <SelectDropdown
        value={currentRole || "user"}
        options={options}
        onChange={handleChange}
        className="w-full max-w-[200px]"
      />
      {roleSaved && (
        <span className="text-emerald-400 shrink-0 flex items-center gap-1 text-[11px]">
          <Check size={12} strokeWidth={3} /> {doneLabel}
        </span>
      )}
    </div>
  );
}
