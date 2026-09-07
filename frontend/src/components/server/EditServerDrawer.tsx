"use client";

import React, { useState, useCallback } from "react";
import {
  Server,
  Save,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { EditServerDrawerSkeleton } from "./EditServerDrawerSkeleton";
import { useServerEdit } from "@/hooks/useServerEdit";
import { Drawer } from "@/components/ui/Drawer";
import { RESOURCE_FIELDS, ResourceInputCard, ResourceKey } from "./ResourceInputCard";





interface EditServerDrawerProps {
  serverId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export function EditServerDrawer({ serverId, onClose, onUpdate }: EditServerDrawerProps) {
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  const {
    loading,
    server,
    form,
    setForm,
    handleSave,
    saving,
    remaining,
    exceeds,
    violations,
    isFormValid,
    error,
  } = useServerEdit(serverId);

  const updateValue = useCallback((key: ResourceKey, v: number) => {
    setForm((prev) => ({ ...prev, [key]: v }));
  }, [setForm]);



  const headerExtra = server ? (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#161616] px-2.5 py-1 text-xs text-[#888]">
        {server.locationFlag && (
          <img 
            src={server.locationFlag.startsWith('http') 
              ? server.locationFlag 
              : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.locationFlag.startsWith('/') ? '' : '/'}${server.locationFlag}`}
            alt="Node flag" 
            className="w-3.5 h-3 object-cover rounded-[2px]"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {server.location || 'Unknown Node'}
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#161616] px-2.5 py-1 text-xs text-[#888]">
        {server.eggIcon && (
          <img 
            src={server.eggIcon.startsWith('http') 
              ? server.eggIcon 
              : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.eggIcon.startsWith('/') ? '' : '/'}${server.eggIcon}`}
            alt="Egg icon" 
            className="w-3.5 h-3.5 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {server.eggName || 'Unknown Egg'}
      </span>
    </div>
  ) : null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={server?.name || 'Edit Server'}
      subtitle={server?.uuid ? `UUID: ${server.uuid.split('-')[0]}...` : 'Update configuration'}
      icon={<Server className="text-[#D4D4D4]" size={22} />}
      headerExtra={headerExtra}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || saved || failed}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={async (e) => {
              setFailed(false);
              const success = await handleSave(e);
              if (success) {
                setSaved(true);
                setTimeout(() => {
                  if (onUpdate) onUpdate();
                  onClose();
                }, 1000);
              } else {
                setFailed(true);
                setTimeout(() => setFailed(false), 3000);
              }
            }}
            disabled={saving || saved || failed || !isFormValid || server?.suspended || server?.status?.toLowerCase() === 'creating'}
            className={`flex min-w-[140px] max-w-[300px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                saved
                  ? "bg-emerald-500 border border-emerald-500 text-white cursor-default"
                  : failed
                  ? "bg-red-500 border border-red-500 text-white cursor-default"
                  : saving || !isFormValid || server?.suspended || server?.status?.toLowerCase() === 'creating'
                  ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                  : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
            }`}
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : saved ? (
              "Saved!"
            ) : failed ? (
              "Failed to Save"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      }
    >
      {loading ? (
        <EditServerDrawerSkeleton />
      ) : (
        <div className="space-y-6">
                <section>
                  <h2 className="text-base font-semibold text-white">Server Details</h2>
                  <p className="mt-0.5 text-sm text-[#888]">Configure your server&apos;s basic information</p>

                  <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
                    Server Name <span className="text-[#FF5722]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))}
                    placeholder="Enter server name"
                    className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                  />
                  {violations.name && <p className="mt-1.5 text-xs text-red-400">{violations.name}</p>}
                </section>

                <section className="mt-8">
                  <div className="flex items-center justify-between mb-0.5">
                      <h2 className="text-base font-semibold text-white">Resource Limits</h2>
                  </div>
                  <p className="text-sm text-[#888]">Configure your server&apos;s resource allocation</p>

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {RESOURCE_FIELDS.map((field) => (
                      <ResourceInputCard
                        key={field.key}
                        field={field}
                        value={form[field.key]}
                        remaining={remaining[field.key]}
                        violation={violations[field.key]}
                        isExceeding={exceeds[field.key]}
                        updateValue={updateValue}
                      />
                    ))}
                  </div>
                </section>
        </div>
      )}
    </Drawer>
  );
}
