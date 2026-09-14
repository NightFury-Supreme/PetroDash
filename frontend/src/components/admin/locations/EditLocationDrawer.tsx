"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useEffect, useState, useRef } from 'react';
import { Globe, Trash, Loader2, Check, Upload, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';

const INPUT_CLASS = "w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60";

interface EditLocationDrawerProps {
  locationId: string;
  onClose: () => void;
  onUpdate: () => void;
}

function DrawerSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden px-1 pb-6 animate-in fade-in duration-300">
      <div className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-5">
          <div>
            <div className="h-4 w-32 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-3 w-48 rounded bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/[0.02] border border-[#222] animate-pulse shrink-0" />
              <div className="flex-1 h-[44px] rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
        </div>

        <div className="border-t border-white/[0.06]" />

        {/* Platform Config */}
        <div className="space-y-5">
          <div>
            <div className="h-4 w-40 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-3 w-48 rounded bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-32 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-3 w-20 rounded bg-white/[0.03] animate-pulse mb-1.5" />
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
        </div>

        <div className="border-t border-white/[0.06]" />

        {/* Permissions */}
        <div className="space-y-5">
          <div>
            <div className="h-4 w-32 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-3 w-64 rounded bg-white/[0.02] animate-pulse mb-4" />
          </div>
          <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[72px] w-full bg-white/[0.015] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditLocationDrawer({ locationId, onClose, onUpdate }: EditLocationDrawerProps) {
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFlagFile, setPendingFlagFile] = useState<File | null>(null);
  const [flagPreview, setFlagPreview] = useState<string | null>(null);
  const [uploadingFlag, setUploadingFlag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations/${locationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async r => {
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setForm({
        _id: d._id || locationId,
        name: d.name || '',
        flag: d.flag || '',
        latencyUrl: d.latencyUrl || '',
        serverLimit: String(d.serverLimit ?? '0'),
        platformLocationId: d.platform?.platformLocationId || '',
        swapMb: String(d.platform?.swapMb ?? '-1'),
        blockIoWeight: String(d.platform?.blockIoWeight ?? '500'),
        cpuPinning: d.platform?.cpuPinning || '',
        allowedPlans: Array.isArray(d.allowedPlans) ? d.allowedPlans : [],
        serversCount: d.serversCount ?? 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));

    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/plans`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingPlans(false));
  }, [locationId]);

  const handleFileSelection = (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPendingFlagFile(file);
    setFlagPreview(URL.createObjectURL(file));
    setForm((f: any) => ({ ...f, flag: 'pending' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFlag = () => { setPendingFlagFile(null); setFlagPreview(null); setForm((f: any) => ({ ...f, flag: '' })); };
    
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name || form.name.trim().length === 0) {
      setError("Location name is required.");
      return;
    }
    if (!pendingFlagFile && (!form.flag || form.flag === 'pending')) {
      setError("Location flag is required.");
      return;
    }
    if (!form.latencyUrl || form.latencyUrl.trim().length === 0) {
      setError("Node IP is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      let finalFlag = form.flag === 'pending' ? '' : form.flag;
      if (pendingFlagFile) {
        setUploadingFlag(true);
        const fd = new FormData(); fd.append('icon', pendingFlagFile);
        const uploadRes = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        setUploadingFlag(false);
        if (!uploadRes.ok) throw new Error('Failed to upload flag image');
        const uploadData = await uploadRes.json();
        finalFlag = uploadData.filePath;
      }
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name, flag: finalFlag, latencyUrl: form.latencyUrl,
          serverLimit: Number(form.serverLimit || 0),
          platform: { platformLocationId: form.platformLocationId, swapMb: Number(form.swapMb || -1), blockIoWeight: Number(form.blockIoWeight || 500), cpuPinning: form.cpuPinning },
          allowedPlans: form.allowedPlans,
        }),
      });
      if (!res.ok) { let d: any = {}; try { d = await res.json(); } catch {} throw new Error(d?.error || 'Failed'); }
      onUpdate(); onClose();
    } catch (err: any) { setError(err.message || 'Failed to update'); } finally { setSubmitting(false); }
  };

  const remove = async () => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations/${locationId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { let d: any = {}; try { d = await res.json(); } catch {} throw new Error(d?.error || 'Failed to delete'); }
    onUpdate(); onClose();
  };

  return (
    <>
      <Drawer
        isOpen={true}
        onClose={onClose}
        title={loading ? 'Edit Location' : (form?.name ?? 'Edit Location')}
        subtitle={form?._id ? `ID: ${form._id}` : 'Update configuration'}
        icon={<Globe className="text-[#D4D4D4]" size={22} />}
        footer={
          !loading && form ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 group relative">
                <button
                  type="button"
                  onClick={() => (!form.serversCount || form.serversCount === 0) && setIsDeleteDrawerOpen(true)}
                  disabled={form.serversCount !== undefined && form.serversCount > 0}
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={form.serversCount > 0 ? 'Cannot delete location with existing servers' : ''}
                ><Trash size={15} /> Delete</button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm font-medium text-[#888] hover:text-[#D4D4D4] transition-colors disabled:opacity-50 bg-transparent border border-[#222] rounded-lg">Cancel</button>
                <button type="submit" form="location-form" disabled={submitting} className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed">
                  {(submitting || uploadingFlag) ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full animate-in fade-in duration-300">
              <div className="h-[40px] w-[100px] rounded-lg bg-red-500/5 border border-red-500/10 animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-[40px] w-[70px] rounded-lg bg-white/[0.02] animate-pulse" />
                <div className="h-[40px] w-[130px] rounded-lg bg-[#FF5722]/20 animate-pulse" />
              </div>
            </div>
          )
        }
      >
        <div className="flex flex-col h-full overflow-hidden">
          {loading || !form ? (
            <DrawerSkeleton />
          ) : (
            <div className="flex-1 overflow-y-auto px-1 pb-6">
              <form id="location-form" onSubmit={save} className="space-y-8">
                {error && (
                  <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {/* Basic Info */}
                <div className="space-y-5">
                  <div><h3 className="text-sm font-semibold text-white mb-0.5">Basic Information</h3><p className="text-xs text-[#888]">Configure the location identity</p></div>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Location Name <span className="text-[#FF5722]">*</span></label>
                    <input className={INPUT_CLASS} value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. US East" />
                  </div>
                  <div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Flag / Icon <span className="text-[#FF5722]">*</span></label>
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
                    <input className={INPUT_CLASS} value={form.latencyUrl} onChange={e => setForm((f: any) => ({ ...f, latencyUrl: e.target.value }))} placeholder="e.g. 192.168.1.1 or node.example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Server Limit</label>
                    <input type="number" className={INPUT_CLASS} value={form.serverLimit} onChange={e => setForm((f: any) => ({ ...f, serverLimit: e.target.value }))} min="0" />
                    <p className="mt-1 text-[10px] text-[#666]">Maximum servers (0 = unlimited)</p>
                  </div>
                </div>

                <div className="border-t border-white/[0.06]" />

                {/* Platform Config */}
                <div className="space-y-5">
                  <div><h3 className="text-sm font-semibold text-white mb-0.5">Platform Configuration</h3><p className="text-xs text-[#888]">Link to your Pterodactyl panel</p></div>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Platform Location ID</label>
                    <input className={INPUT_CLASS} value={form.platformLocationId} onChange={e => setForm((f: any) => ({ ...f, platformLocationId: e.target.value }))} placeholder="e.g. 1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Swap (MB)</label>
                      <input type="number" className={INPUT_CLASS} value={form.swapMb} onChange={e => setForm((f: any) => ({ ...f, swapMb: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Block IO Weight</label>
                      <input type="number" className={INPUT_CLASS} value={form.blockIoWeight} onChange={e => setForm((f: any) => ({ ...f, blockIoWeight: e.target.value }))} min="10" max="1000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">CPU Pinning</label>
                    <input className={INPUT_CLASS} value={form.cpuPinning} onChange={e => setForm((f: any) => ({ ...f, cpuPinning: e.target.value }))} placeholder="e.g. 0-3 (optional)" />
                  </div>
                </div>

                <div className="border-t border-white/[0.06]" />

                {/* Permissions */}
                <div className="space-y-5">
                  <div><h3 className="text-sm font-medium text-white mb-1">Allowed Plans</h3><p className="text-xs text-[#888] mb-4">Select which plans are permitted to deploy in this location. Leave empty to allow all plans.</p></div>
                  {loadingPlans ? (
                    <div className="flex items-center gap-2 text-[#888] text-sm"><Loader2 size={14} className="animate-spin" /> Loading plans...</div>
                  ) : plans.length === 0 ? <p className="text-sm text-[#888]">No plans found.</p> : (
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
                          setForm((f: any) => ({ ...f, allowedPlans: f.allowedPlans.filter((v: any) => v !== id && v !== name) }));
                        } else {
                          setForm((f: any) => ({ ...f, allowedPlans: [...f.allowedPlans, id] }));
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
              </form>
            </div>
          )}
        </div>
    </Drawer>

    <DeleteDrawer
      isOpen={isDeleteDrawerOpen}
      onClose={() => setIsDeleteDrawerOpen(false)}
      onConfirm={remove}
      entityType="Location"
      entityName={form?.name || ''}
      entitySubText={form ? `Platform ID: ${form.platformLocationId || 'Not set'}` : ''}
      icon={
        (flagPreview || (form && form.flag && form.flag !== 'pending')) ? (
          <img src={flagPreview || `${process.env.NEXT_PUBLIC_API_BASE || ''}${form?.flag}`} alt="" className="w-6 h-6 object-contain rounded" />
        ) : <Globe size={24} />
      }
      warningPoints={[
        "Location configuration will be permanently deleted.",
        "This action cannot be undone."
      ]}
    />
    </>
  );
}
