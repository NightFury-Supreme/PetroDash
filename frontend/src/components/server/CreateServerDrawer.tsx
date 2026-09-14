"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Server,
  Loader2,
  Check,
  Globe,
  Box,
  Activity,
  Cpu,
  HardDrive,
  Network,
  Database,
  Archive,
  CircuitBoard,
  Crown,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { CreateServerDrawerSkeleton } from "./CreateServerDrawerSkeleton";
import { useServerCreate, CreateFormData } from "@/hooks/useServerCreate";
import { RESOURCE_FIELDS, ResourceInputCard } from "./ResourceInputCard";

import { useToast } from "@/components/ui/ToastProvider";

type Step = 'resources' | 'software' | 'location' | 'summary';

const STEPS: { id: Step; label: string }[] = [
  { id: 'resources', label: 'Limits' },
  { id: 'software', label: 'Software' },
  { id: 'location', label: 'Location' },
  { id: 'summary', label: 'Summary' },
];

interface CreateServerDrawerProps {
  onClose: () => void;
  onUpdate?: () => void;
}

export function CreateServerDrawer({ onClose, onUpdate }: CreateServerDrawerProps) {
  const { showError, showSuccess } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = STEPS[currentStepIndex].id;

  const {
    loading,
    error,
    eggs,
    locations,
    form,
    setForm,
    violations,
    saving,
    remaining,
    exceeds,
    isFormValid,
    handleSave
  } = useServerCreate();

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const updateValue = useCallback((key: keyof CreateFormData, v: number | string) => {
    setForm((prev) => ({ ...prev, [key]: v }));
  }, [setForm]);

  const groupedEggs = useMemo(() => {
    const groups: Record<string, typeof eggs> = {};
    eggs.forEach((egg) => {
      const cat = egg.categoryName || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(egg);
    });
    return groups;
  }, [eggs]);

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Create Server"
      subtitle="Deploy a new server instance"
      icon={<Server className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {currentStepIndex > 0 ? (
            <button
              onClick={() => setCurrentStepIndex(i => i - 1)}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            >
              Cancel
            </button>
          )}
          
          {currentStepIndex < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStepIndex(i => i + 1)}
              disabled={
                (currentStep === 'resources' && (!form.name.trim() || Object.values(exceeds).some(Boolean) || ['diskMb', 'memoryMb', 'cpuPercent', 'backups', 'databases', 'allocations'].some(k => (violations as any)[k]))) ||
                (currentStep === 'software' && !form.eggId) ||
                (currentStep === 'location' && !form.locationId)
              }
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={async (e) => {
                const success = await handleSave(e);
                if (success) {
                  showSuccess("Server created successfully!");
                  if (onUpdate) onUpdate();
                  onClose();
                } else {
                  // error is handled by useServerCreate and our useEffect will catch it, or it will be in the `error` state.
                  // Wait, useServerCreate sets its own `error` state. We just added a useEffect to watch `error`.
                }
              }}
              disabled={saving || !isFormValid}
              className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                  saving || !isFormValid
                    ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                    : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
              }`}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Deploying...</>
              ) : (
                "Create Server"
              )}
            </button>
          )}
        </div>
      }
    >
      {loading ? (
        <CreateServerDrawerSkeleton />
      ) : (
        <>
          <div className="flex flex-col min-h-[300px]">
            {/* Horizontal Step Indicator */}
            <div className="flex items-center justify-between mb-8">
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium z-10 transition-colors ${
                    idx === currentStepIndex
                      ? 'bg-[#FF5722] text-white'
                      : idx < currentStepIndex
                      ? 'bg-[#FF5722]/20 text-[#FF5722]'
                      : 'bg-[#161616] text-[#888] border border-[#222]'
                  }`}>
                    {idx < currentStepIndex ? <Check size={14} /> : (idx + 1)}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-4 transition-colors ${idx < currentStepIndex ? 'bg-[#FF5722]/50' : 'bg-[#222]'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div className="flex-1 pb-8 min-w-0">

          {currentStep === 'resources' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <h2 className="text-base font-semibold text-white">Server Details</h2>
                <p className="mt-0.5 text-sm text-[#888]">Configure your server's basic information</p>
    
                <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
                  Server Name <span className="text-[#FF5722]">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateValue('name', e.target.value)}
                  placeholder="Enter server name"
                  className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                />
                {violations.name && <p className="mt-1.5 text-xs text-red-400">{violations.name}</p>}
              </section>

              <section className="mt-8">
                <div className="flex items-center justify-between mb-0.5">
                    <h2 className="text-base font-semibold text-white">Resource Limits</h2>
                </div>
                <p className="text-sm text-[#888]">Configure your server's resource allocation</p>
    
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {RESOURCE_FIELDS.map((field) => (
                  <ResourceInputCard
                    key={field.key}
                    field={field}
                    value={form[field.key] as number}
                    remaining={(remaining as any)[field.key]}
                    violation={violations[field.key]}
                    isExceeding={(exceeds as any)[field.key]}
                    updateValue={(k, v) => updateValue(k as keyof CreateFormData, v)}
                  />
                ))}
              </div>
            </section>
          </div>
          )}

          {currentStep === 'software' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-base font-semibold text-white">Software</h2>
              <p className="mt-0.5 text-sm text-[#888]">Select the software to run on your server</p>
              <div className="mt-5 space-y-6">
                {Object.entries(groupedEggs).map(([category, categoryEggs]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-sm font-medium text-white px-2">{category}</h3>
                    <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
                      {categoryEggs.map((egg) => {
                        const selected = form.eggId === egg._id;
                        return (
                          <button
                            type="button"
                            key={egg._id}
                            onClick={() => egg.isPlanAllowed && updateValue('eggId', egg._id)}
                            disabled={!egg.isPlanAllowed}
                            className={`w-full flex items-center justify-between py-3 px-2 group transition-colors ${
                              !egg.isPlanAllowed ? 'cursor-not-allowed' : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 flex items-center justify-center shrink-0 relative ${!egg.isPlanAllowed ? 'opacity-40 grayscale' : ''}`}>
                                {egg.icon ? (
                                  <img 
                                    src={egg.icon.startsWith('http') ? egg.icon : `${process.env.NEXT_PUBLIC_API_BASE || ''}${egg.icon.startsWith('/') ? '' : '/'}${egg.icon}`}
                                    alt="Icon" 
                                    className="w-full h-full object-contain"
                                    onError={(e) => { 
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextElementSibling) {
                                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                      }
                                    }}
                                  />
                                ) : null}
                                <Box 
                                  className="text-[#888] absolute inset-0 m-auto" 
                                  size={18} 
                                  style={{ display: egg.icon ? 'none' : 'block' }}
                                />
                              </div>
                              <div className="text-left flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <h3 className={`text-sm font-medium transition-colors ${!egg.isPlanAllowed ? 'text-zinc-500' : 'text-[#E0E0E0] group-hover:text-white'}`}>{egg.name}</h3>
                                  {egg.allowedPlanNames && egg.allowedPlanNames.length > 0 && (
                                    <div title={`Requires plan: ${egg.allowedPlanNames.join(', ')}`} className="text-yellow-400 cursor-help drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                                      <Crown size={14} fill="currentColor" />
                                    </div>
                                  )}
                                  {egg.recommended && (
                                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${!egg.isPlanAllowed ? 'bg-emerald-500/5 text-emerald-500/50' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <div className={`flex flex-col gap-1.5 text-[11px] ${!egg.isPlanAllowed ? 'text-zinc-600' : 'text-[#888]'}`}>
                                  <p className="line-clamp-2 leading-snug">{egg.description}</p>
                                  {typeof egg.serverCount === 'number' && egg.serverCount > 0 && (
                                    <span className="flex items-center gap-1 text-zinc-400">
                                      <Server size={10} />
                                      {egg.serverCount} {egg.serverCount === 1 ? 'server' : 'servers'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pl-4 shrink-0">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                selected ? 'border-[#FF5722] bg-[#FF5722]' : 'border-white/20 group-hover:border-white/40 bg-transparent'
                              }`}>
                                {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {violations.eggId && <p className="mt-2 text-xs text-red-400">{violations.eggId}</p>}
            </section>
          )}

          {currentStep === 'location' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-base font-semibold text-white">Location</h2>
              <p className="mt-0.5 text-sm text-[#888]">Select the deployment location for your server</p>
  
              <div className="mt-5 border-t border-white/[0.06] divide-y divide-white/[0.06]">
                {locations.map((loc) => {
                  const selected = form.locationId === loc._id;
                  return (
                    <button
                      type="button"
                      key={loc._id}
                      onClick={() => loc.isPlanAllowed && updateValue('locationId', loc._id)}
                      disabled={!loc.isPlanAllowed}
                      className={`w-full flex items-center justify-between py-3 px-2 group transition-colors ${
                        !loc.isPlanAllowed ? 'cursor-not-allowed' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 relative ${!loc.isPlanAllowed ? 'opacity-40 grayscale' : ''}`}>
                          {(loc.flag || loc.flagUrl) ? (
                            <img 
                              src={(loc.flag || loc.flagUrl).startsWith('http') ? (loc.flag || loc.flagUrl) : `${process.env.NEXT_PUBLIC_API_BASE || ''}${(loc.flag || loc.flagUrl).startsWith('/') ? '' : '/'}${loc.flag || loc.flagUrl}`}
                              alt="Flag" 
                              className="w-full h-full object-contain rounded-[2px]"
                              onError={(e) => { 
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                }
                              }}
                            />
                          ) : null}
                          <Globe 
                            className="text-[#888] absolute inset-0 m-auto" 
                            size={18} 
                            style={{ display: (loc.flag || loc.flagUrl) ? 'none' : 'block' }}
                          />
                        </div>
                          <div className="text-left flex flex-col items-start gap-0.5">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-sm font-medium transition-colors ${!loc.isPlanAllowed ? 'text-zinc-500' : 'text-[#E0E0E0] group-hover:text-white'}`}>{loc.name}</h3>
                              {loc.allowedPlanNames && loc.allowedPlanNames.length > 0 && (
                                <div title={`Requires plan: ${loc.allowedPlanNames.join(', ')}`} className="text-yellow-400 cursor-help drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                                  <Crown size={14} fill="currentColor" />
                                </div>
                              )}
                            </div>
                            {(loc.description || loc.shortCode) && (
                              <p className={`text-[11px] ${!loc.isPlanAllowed ? 'text-zinc-600' : 'text-[#888]'}`}>
                              {loc.description ? (loc.description.length > 60 ? loc.description.slice(0, 60) + '...' : loc.description) : loc.shortCode}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 pl-4 shrink-0">
                        <div className={`flex flex-col items-end gap-1 text-xs ${!loc.isPlanAllowed ? 'opacity-40 grayscale' : ''}`}>
                          {typeof loc.ping === 'number' && (
                            <div className={`flex items-center gap-1.5 font-medium ${loc.ping < 100 ? 'text-green-400' : loc.ping < 200 ? 'text-yellow-400' : 'text-red-400'}`}>
                              <Activity size={12} />
                              {loc.ping}ms
                            </div>
                          )}
                          {typeof loc.serverCount === 'number' && (
                            <div className="text-[#888] flex items-center gap-1.5">
                              <Server size={12} className="opacity-70" />
                              <span>{loc.serverCount}{loc.serverLimit ? ` / ${loc.serverLimit}` : ''} Servers</span>
                            </div>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          selected ? 'border-[#FF5722] bg-[#FF5722]' : 'border-white/20 group-hover:border-white/40 bg-transparent'
                        }`}>
                          {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {violations.locationId && <p className="mt-2 text-xs text-red-400">{violations.locationId}</p>}
            </section>
          )}

          {currentStep === 'summary' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-base font-semibold text-white">Summary</h2>
              <p className="mt-0.5 text-sm text-[#888]">Review your server configuration before creating</p>
              
              <div className="mt-6 space-y-8">
                <div>
                  <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 mb-4">General Information</h2>
                  <div className="grid border-y border-white/[0.07] sm:grid-cols-2">
                    {[
                      { 
                        label: 'Server Name', 
                        value: form.name || 'Unnamed Server', 
                        icon: <Server size={14} strokeWidth={2} /> 
                      },
                      { 
                        label: 'Software', 
                        value: eggs.find(e => e._id === form.eggId)?.name || 'None selected', 
                        icon: eggs.find(e => e._id === form.eggId)?.icon ? (
                          <img 
                            src={eggs.find(e => e._id === form.eggId)!.icon!.startsWith('http') ? eggs.find(e => e._id === form.eggId)!.icon : `${process.env.NEXT_PUBLIC_API_BASE || ''}${eggs.find(e => e._id === form.eggId)!.icon!.startsWith('/') ? '' : '/'}${eggs.find(e => e._id === form.eggId)!.icon}`}
                            alt="Icon" 
                            className="w-full h-full object-contain"
                            onError={(e) => { 
                              e.currentTarget.style.display = 'none'; 
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                              }
                            }}
                          />
                        ) : <Box size={14} strokeWidth={2} className="text-[#888]" style={{ display: eggs.find(e => e._id === form.eggId)?.icon ? 'none' : 'block' }} />
                      },
                      { 
                        label: 'Location', 
                        value: locations.find(l => l._id === form.locationId)?.name || 'None selected', 
                        icon: (locations.find(l => l._id === form.locationId)?.flag || locations.find(l => l._id === form.locationId)?.flagUrl) ? (
                          <img 
                            src={(locations.find(l => l._id === form.locationId)!.flag || locations.find(l => l._id === form.locationId)!.flagUrl)!.startsWith('http') ? (locations.find(l => l._id === form.locationId)!.flag || locations.find(l => l._id === form.locationId)!.flagUrl) : `${process.env.NEXT_PUBLIC_API_BASE || ''}${(locations.find(l => l._id === form.locationId)!.flag || locations.find(l => l._id === form.locationId)!.flagUrl)!.startsWith('/') ? '' : '/'}${locations.find(l => l._id === form.locationId)!.flag || locations.find(l => l._id === form.locationId)!.flagUrl}`}
                            alt="Flag" 
                            className="w-full h-full object-contain rounded-[2px]"
                            onError={(e) => { 
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                              }
                            }}
                          />
                        ) : <Globe size={14} strokeWidth={2} className="text-[#888]" style={{ display: (locations.find(l => l._id === form.locationId)?.flag || locations.find(l => l._id === form.locationId)?.flagUrl) ? 'none' : 'block' }} />
                      }
                    ].map((resource, index, arr) => {
                      const total = arr.length;
                      const isLastOdd = index === total - 1 && total % 2 !== 0;
                      return (
                        <div
                          key={resource.label}
                          className={`flex items-center justify-between px-4 py-4 ${
                            index % 2 === 1 && !isLastOdd ? "sm:border-l sm:border-white/[0.05]" : ""
                          } ${index >= 2 ? "border-t border-white/[0.05]" : ""} ${
                            index === 1 ? "border-t border-white/[0.05] sm:border-t-0" : ""
                          } ${isLastOdd ? "sm:col-span-2" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.025] text-zinc-400">
                              {resource.icon}
                            </div>
                            <span className="text-[10px] text-zinc-500">{resource.label}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-white">{resource.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 mb-4">Included Resources</h2>
                  <div className="grid border-y border-white/[0.07] sm:grid-cols-2">
                    {[
                      { label: 'CPU', value: `${form.cpuPercent}%`, icon: <Cpu size={14} strokeWidth={2} /> },
                      { label: 'Memory', value: `${form.memoryMb} MB`, icon: <CircuitBoard size={14} strokeWidth={2} /> },
                      { label: 'Disk', value: `${form.diskMb} MB`, icon: <HardDrive size={14} strokeWidth={2} /> },
                      { label: 'Servers', value: '1', icon: <Server size={14} strokeWidth={2} /> },
                      { label: 'Databases', value: form.databases.toString(), icon: <Database size={14} strokeWidth={2} /> },
                      { label: 'Backups', value: form.backups.toString(), icon: <Archive size={14} strokeWidth={2} /> },
                      { label: 'Ports', value: form.allocations.toString(), icon: <Network size={14} strokeWidth={2} /> },
                    ].map((resource, index, arr) => {
                      const total = arr.length;
                      const isLastOdd = index === total - 1 && total % 2 !== 0;
                      return (
                        <div
                          key={resource.label}
                          className={`flex items-center justify-between px-4 py-4 ${
                            index % 2 === 1 && !isLastOdd ? "sm:border-l sm:border-white/[0.05]" : ""
                          } ${index >= 2 ? "border-t border-white/[0.05]" : ""} ${
                            index === 1 ? "border-t border-white/[0.05] sm:border-t-0" : ""
                          } ${isLastOdd ? "sm:col-span-2" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.025] text-zinc-400">
                              {resource.icon}
                            </div>
                            <span className="text-[10px] text-zinc-500">{resource.label}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-white">{resource.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
          
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}
