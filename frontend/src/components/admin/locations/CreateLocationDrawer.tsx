"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useState, useEffect, useRef } from "react";
import { Globe, Loader2, Check, Upload, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";

type Step = 'basic' | 'platform' | 'permissions';

const STEPS: { id: Step; label: string }[] = [
  { id: 'basic', label: 'Details' },
  { id: 'platform', label: 'Platform' },
  { id: 'permissions', label: 'Permissions' },
];

const INPUT_CLASS = "w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60";

interface CreateLocationDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLocationDrawer({ onClose, onSuccess }: CreateLocationDrawerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = STEPS[currentStepIndex].id;

  const [, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    flag: '',
    latencyUrl: '',
    serverLimit: '0',
    platformLocationId: '',
    swapMb: '-1',
    blockIoWeight: '500',
    cpuPinning: '',
    allowedPlans: [] as string[],
  });

        const [loading, setLoading] = useState(false);
  const [uploadingFlag, setUploadingFlag] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFlagFile, setPendingFlagFile] = useState<File | null>(null);
  const [flagPreview, setFlagPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleFileSelection = (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPendingFlagFile(file);
    setFlagPreview(URL.createObjectURL(file));
    setForm(f => ({ ...f, flag: 'pending' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFlag = () => {
    setPendingFlagFile(null);
    setFlagPreview(null);
    setForm(f => ({ ...f, flag: '' }));
  };

    
  const canGoNext = () => {
    if (currentStep === 'basic') return form.name.trim().length > 0 && form.latencyUrl.trim().length > 0 && (form.flag || pendingFlagFile);
    return true;
  };

  const handleSubmit = async () => {
        setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      let finalFlag = form.flag === 'pending' ? '' : form.flag;

      if (pendingFlagFile) {
        setUploadingFlag(true);
        const fd = new FormData();
        fd.append('icon', pendingFlagFile);
        const uploadRes = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        setUploadingFlag(false);
        if (!uploadRes.ok) throw new Error('Failed to upload flag image');
        const uploadData = await uploadRes.json();
        finalFlag = uploadData.filePath;
      }

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          flag: finalFlag,
          latencyUrl: form.latencyUrl,
          serverLimit: Number(form.serverLimit || 0),
          platform: {
            platformLocationId: form.platformLocationId,
            swapMb: Number(form.swapMb || -1),
            blockIoWeight: Number(form.blockIoWeight || 500),
            cpuPinning: form.cpuPinning,
          },
          allowedPlans: form.allowedPlans,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to create location');
      onSuccess();
    } catch (e: any) {
        console.error(e);
            setLoading(false);
    }
  };

  

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="New Location"
      subtitle="Add a deployment location"
      icon={<Globe className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex(i => i - 1)}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            >
              Cancel
            </button>
          )}
          
          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex(i => i + 1)}
              disabled={!canGoNext()}
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploadingFlag}
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(loading || uploadingFlag) ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create Location"}
            </button>
          )}
        </div>
      }
      >
        <div className="flex flex-col min-h-[300px]">
          {/* Horizontal Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium z-10 transition-colors ${
                  idx === currentStepIndex
                    ? 'bg-[#FF5722] text-white'
                    : idx < currentStepIndex
                    ? 'bg-[#FF5722]/10 text-[#FF5722]'
                    : 'bg-white/[0.02] text-white/30 border border-white/[0.07]'
                }`}>
                  {idx < currentStepIndex ? <Check size={16} /> : (idx + 1)}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-4 transition-colors ${idx < currentStepIndex ? 'bg-[#FF5722]/50' : 'bg-white/[0.07]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex-1 pb-8 min-w-0">
        {currentStep === 'basic' && (
          <div className="space-y-6">
            <div><h3 className="text-sm font-semibold text-white mb-1">Basic Information</h3><p className="text-xs text-[#888]">Configure the location identity</p></div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Location Name <span className="text-[#FF5722]">*</span></label>
                <input className={INPUT_CLASS} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. US East, EU Frankfurt" required />
              </div>
              <div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Location Flag / Icon <span className="text-[#FF5722]">*</span></label>
                  <div className="flex items-center gap-3">
                    {(flagPreview || form.flag) && (
                      <div className="relative w-11 h-11 bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img
                          src={flagPreview || (form.flag && form.flag !== 'pending' ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${form.flag}` : '')}
                          alt="Flag"
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div
                      className="flex-1 min-w-0"
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelection(e.dataTransfer.files?.[0]); }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => handleFileSelection(e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFlag}
                        className={`flex items-center justify-between w-full rounded-lg border px-4 h-[44px] text-sm text-[#888] transition-colors outline-none ${isDragging ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722]' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'}`}
                      >
                        <span className="truncate">
                          {uploadingFlag ? 'Uploading...' : form.flag ? 'Change flag (or drop/paste)' : 'Upload icon (or drop/paste)'}
                        </span>
                        {uploadingFlag ? <Loader2 size={16} className="animate-spin text-[#888] shrink-0" /> : <Upload size={16} className="text-[#888] shrink-0" />}
                      </button>
                    </div>

                    {form.flag && (
                      <button
                        type="button"
                        onClick={handleRemoveFlag}
                        className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#666]">Upload a PNG, JPG, or SVG image (max 5MB)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Node IP <span className="text-[#FF5722]">*</span></label>
                <input className={INPUT_CLASS} value={form.latencyUrl} onChange={e => setForm(f => ({ ...f, latencyUrl: e.target.value }))} placeholder="e.g. 192.168.1.1 or node.example.com" required />
                <p className="mt-1 text-[10px] text-[#666]">IP used to measure ping from the user browser</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Server Limit</label>
                <input type="number" className={INPUT_CLASS} value={form.serverLimit} onChange={e => setForm(f => ({ ...f, serverLimit: e.target.value }))} min="0" placeholder="0 = unlimited" />
                <p className="mt-1 text-[10px] text-[#666]">Maximum servers in this location (0 = unlimited)</p>
              </div>
            </div>
          </div>
        )}
        {currentStep === 'platform' && (
          <div className="space-y-6">
            <div><h3 className="text-sm font-semibold text-white mb-1">Platform Configuration</h3><p className="text-xs text-[#888]">Link this location to your Pterodactyl panel</p></div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Platform Location ID <span className="text-[#FF5722]">*</span></label>
                <input className={INPUT_CLASS} value={form.platformLocationId} onChange={e => setForm(f => ({ ...f, platformLocationId: e.target.value }))} placeholder="e.g. 1" />
                <p className="mt-1 text-[10px] text-[#666]">The location ID from your Pterodactyl panel</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Swap (MB)</label>
                  <input type="number" className={INPUT_CLASS} value={form.swapMb} onChange={e => setForm(f => ({ ...f, swapMb: e.target.value }))} placeholder="-1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Block IO Weight</label>
                  <input type="number" className={INPUT_CLASS} value={form.blockIoWeight} onChange={e => setForm(f => ({ ...f, blockIoWeight: e.target.value }))} placeholder="500" min="10" max="1000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">CPU Pinning</label>
                <input className={INPUT_CLASS} value={form.cpuPinning} onChange={e => setForm(f => ({ ...f, cpuPinning: e.target.value }))} placeholder="e.g. 0-3 (optional)" />
              </div>
            </div>
          </div>
        )}
        {currentStep === 'permissions' && (
          <div className="space-y-6">
            <div><h3 className="text-sm font-medium text-white mb-1">Allowed Plans</h3><p className="text-xs text-[#888] mb-4">Select which plans are permitted to deploy in this location. Leave empty to allow all plans.</p></div>
            {loadingPlans ? (
              <div className="flex items-center gap-2 text-[#888] text-sm"><Loader2 size={14} className="animate-spin" /> Loading plans...</div>
            ) : plans.length === 0 ? (
              <p className="text-sm text-[#888]">No plans found.</p>
            ) : (
              <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
                {plans.map((p: any) => {
                  const id = String(p._id || p.id);
                  const name = p.name || id;
                  const price = p.pricePerMonth !== undefined ? Number(p.pricePerMonth) : 0;
                  const currency = p.currency || 'USD';
                  const selected = (form.allowedPlans || []).includes(id) || (form.allowedPlans || []).includes(name);
                  
                  return (
                    <button 
                      type="button"
                      key={id} 
                      onClick={() => {
                        if (selected) {
                          setForm(f => ({ ...f, allowedPlans: f.allowedPlans.filter(v => v !== id && v !== name) }));
                        } else {
                          setForm(f => ({ ...f, allowedPlans: [...f.allowedPlans, id] }));
                        }
                      }}
                      className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${selected ? 'bg-[#FF5722]/[0.06]' : 'hover:bg-white/[0.015]'}`}
                    >
                      <div className="min-w-0 pr-4">
                        <span className={`block text-sm font-medium ${selected ? 'text-white/90' : 'text-white/70'}`}>
                          {name}
                        </span>
                        <span className="block mt-0.5 font-mono text-[11px] text-white/35">
                          {id}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 shrink-0">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.13em] text-white/20 text-right">Price</p>
                          <p className={`text-sm font-semibold tracking-tight mt-0.5 ${selected ? 'text-white/90' : 'text-white/60'}`}>
                            {price > 0 ? price.toFixed(2) : "0.00"} <span className="text-[10px] font-normal text-white/25">{currency}</span>
                          </p>
                        </div>
                        
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors shrink-0 ${
                          selected ? 'bg-[#FF5722] border-[#FF5722] text-black' : 'border-white/15 text-transparent'
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    </button>
                  );
                })}

              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </Drawer>
  );
}
