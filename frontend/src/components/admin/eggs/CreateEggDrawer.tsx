"use client";

import React, { useState, useEffect, useRef } from "react";
import { Egg, Loader2, Check, Upload, Trash2, Plus } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";

type Step = 'basic' | 'panel' | 'permissions';

const STEPS: { id: Step; label: string }[] = [
  { id: 'basic', label: 'Details' },
  { id: 'panel', label: 'Panel' },
  { id: 'permissions', label: 'Permissions' },
];

type FormState = {
  name: string;
  category: string;
  description: string;
  icon: string;
  pterodactylEggId: string;
  pterodactylNestId: string;
  recommended: boolean;
  allowedPlans: string[];
};

import { CategorySelect } from './CategorySelect';

interface CreateEggDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
}
export function CreateEggDrawer({ onClose, onSuccess }: CreateEggDrawerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = STEPS[currentStepIndex].id;

  const [form, setForm] = useState<FormState>({
    name: '',
    category: '',
    icon: '',
    pterodactylEggId: '',
    pterodactylNestId: '',
    recommended: false,
    description: '',
    allowedPlans: [] as string[],
  });
  const [env, setEnv] = useState<Array<{ key: string; value: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/plans`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleFileSelection = (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    setPendingIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setForm(f => ({ ...f, icon: 'pending' })); // just to indicate an icon is set
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file) handleFileSelection(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleUploadIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files?.[0]);
  };

  const handleRemoveIcon = () => {
    setPendingIconFile(null);
    setIconPreview(null);
    setForm(f => ({ ...f, icon: '' }));
  };

  const isFormValid = form.name.trim() !== '' && form.category.trim() !== '' && form.pterodactylEggId !== '' && form.pterodactylNestId !== '' && form.icon !== '';

  const submit = async () => {
    if (!pendingIconFile && !form.icon) {
      setError('Egg icon is required.');
      return;
    }

    setError(null);
    setLoading(true);
    setFailed(false);
    
    try {
      const token = localStorage.getItem('auth_token');
      let finalIcon = form.icon;

      if (pendingIconFile) {
        setUploadingIcon(true);
        const fd = new FormData();
        fd.append('icon', pendingIconFile);
        
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });
        
        setUploadingIcon(false);
        if (!uploadRes.ok) {
           const errData = await uploadRes.json().catch(() => ({}));
           throw new Error(errData.error || 'Failed to upload icon');
        }
        
        const data = await uploadRes.json();
        finalIcon = data.filePath;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          icon: finalIcon,
          pterodactylEggId: Number(form.pterodactylEggId || 0),
          pterodactylNestId: Number(form.pterodactylNestId || 0),
          env: env.filter(v => v.key && v.value),
        }),
      });
      
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data?.error || 'Failed to create egg');
      
      setSaved(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    } finally {
      setLoading(false);
      setUploadingIcon(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Create Egg"
      subtitle="Deploy a new server template"
      icon={<Egg className="text-[#D4D4D4]" size={22} />}
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
                (currentStep === 'basic' && (!form.name.trim() || !form.category.trim() || !form.icon || !form.description.trim())) ||
                (currentStep === 'panel' && (!form.pterodactylEggId || !form.pterodactylNestId))
              }
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading || saved || failed || !isFormValid}
              className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                saved
                  ? 'bg-emerald-500 border border-emerald-500 text-white cursor-default'
                  : failed
                  ? 'bg-red-500 border border-red-500 text-white cursor-default'
                  : loading || !isFormValid
                  ? 'bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed'
                  : 'bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]'
              }`}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating...</>
              ) : saved ? (
                "Created!"
              ) : failed ? (
                "Failed to Create"
              ) : (
                "Create Egg"
              )}
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

            {/* Step Content */}
            <div className="flex-1 pb-8 min-w-0">
          
          {currentStep === 'basic' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <h2 className="text-base font-semibold text-white">Basic Information</h2>
                <p className="mt-0.5 text-sm text-[#888]">Configure the egg's identity and category</p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
                      Name <span className="text-[#FF5722]">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., Minecraft Vanilla"
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
                      Category <span className="text-[#FF5722]">*</span>
                    </label>
                    <CategorySelect 
                      value={form.category} 
                      onChange={(cat) => setForm(f => ({ ...f, category: cat }))} 
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-[#D4D4D4]">
                        Description <span className="text-[#FF5722]">*</span>
                      </label>
                      <span className="text-xs text-[#666]">
                        {form.description?.length || 0} / 150
                      </span>
                    </div>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe this egg..."
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 min-h-[80px]"
                      maxLength={150}
                      required
                    />
                  </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
                    Egg Icon <span className="text-[#FF5722]">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {(iconPreview || form.icon) && (
                      <div className="relative w-11 h-11 bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img 
                          src={iconPreview || (form.icon !== 'pending' ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${form.icon}` : '')} 
                          alt="Egg icon" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                        onChange={handleUploadIcon}
                      />
                      
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingIcon}
                        className={`flex items-center justify-between w-full rounded-lg border px-4 h-[44px] text-sm text-[#888] transition-colors outline-none ${isDragging ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722]' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'}`}
                      >
                        <span className="truncate">
                          {uploadingIcon ? 'Uploading...' : form.icon ? 'Change icon (or drop/paste)' : 'Upload icon (or drop/paste)'}
                        </span>
                        {uploadingIcon ? <Loader2 size={16} className="animate-spin text-[#888] shrink-0" /> : <Upload size={16} className="text-[#888] shrink-0" />}
                      </button>
                    </div>
                    
                    {form.icon && (
                      <button
                        type="button"
                        onClick={handleRemoveIcon}
                        className="flex items-center justify-center h-[44px] w-[44px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#666]">Upload a PNG, JPG, or SVG image (max 5MB)</p>
                </div>
              </section>
            </div>
          )}

          {currentStep === 'panel' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <div className="flex items-center justify-between mb-0.5">
                  <h2 className="text-base font-semibold text-white">Panel Configuration</h2>
                </div>
                <p className="text-sm text-[#888]">Link this egg to your Pterodactyl panel</p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
                      Pterodactyl Egg ID <span className="text-[#FF5722]">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.pterodactylEggId}
                      onChange={(e) => setForm(f => ({ ...f, pterodactylEggId: e.target.value }))}
                      placeholder="e.g., 1"
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
                      Pterodactyl Nest ID <span className="text-[#FF5722]">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.pterodactylNestId}
                      onChange={(e) => setForm(f => ({ ...f, pterodactylNestId: e.target.value }))}
                      placeholder="e.g., 1"
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                    />
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div className="flex items-center justify-between mb-0.5">
                  <div>
                    <h2 className="text-base font-semibold text-white">Environment Variables</h2>
                    <p className="mt-0.5 text-sm text-[#888]">Default variables sent to the panel when creating a server</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setEnv([...env, { key: '', value: '' }])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-medium text-[#D4D4D4] transition-colors"
                  >
                    <Plus size={14} /> Add Variable
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {env.map((v, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <input 
                        className="w-full sm:w-1/3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60" 
                        value={v.key} 
                        onChange={(e) => setEnv(env.map((x, i) => i === idx ? { ...x, key: e.target.value } : x))} 
                        placeholder="KEY" 
                      />
                      <div className="flex w-full sm:w-2/3 gap-2">
                        <input 
                          className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60" 
                          value={v.value} 
                          onChange={(e) => setEnv(env.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))} 
                          placeholder="VALUE" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setEnv(env.filter((_, i) => i !== idx))} 
                          className="flex items-center justify-center w-[42px] h-[42px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                          title="Remove variable"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {env.length === 0 && (
                    <div className="py-6 text-center text-xs text-white/25 italic">
                      No environment variables configured.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {currentStep === 'permissions' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <div className="flex items-center justify-between mb-0.5">
                  <h2 className="text-base font-semibold text-white">Permissions & Tags</h2>
                </div>
                <p className="text-sm text-[#888]">Configure visibility and deployment rules</p>

                <div className="mt-6 space-y-6">
                  {/* Recommended Toggle */}
                  <div className="border-t border-white/[0.06]">
                    <label className="flex items-center justify-between px-0 py-4 cursor-pointer group hover:bg-transparent transition-colors">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={form.recommended}
                      onChange={(e) => setForm(f => ({ ...f, recommended: e.target.checked }))}
                    />
                    <div className="flex flex-col pr-4">
                      <span className="text-sm font-medium text-white/70 mb-0.5">Recommended Template</span>
                      <span className="text-xs text-white/35">Highlight this egg with a badge to encourage users to deploy it</span>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${form.recommended ? 'bg-[#FF5722]' : 'bg-white/[0.12]'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${form.recommended ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>
                  </div>

                  {/* Allowed Plans */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">Allowed Plans</h3>
                    <p className="text-xs text-[#888] mb-4">Select which plans are permitted to deploy this egg. Leave empty to allow all plans.</p>
                    
                    {loadingPlans ? (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm text-[#888]">
                        <Loader2 size={14} className="animate-spin" /> Fetching plans...
                      </div>
                    ) : (
                      <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
                        {plans.map((p) => {
                          const id = String(p._id || p.id);
                          const name = p.name || id;
                          const price = p.pricePerMonth !== undefined ? Number(p.pricePerMonth) : 0;
                          const currency = p.currency || 'USD';
                          const selected = form.allowedPlans.includes(id) || form.allowedPlans.includes(name);
                          
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
                        {plans.length === 0 && (
                          <div className="py-6 text-center text-xs text-white/25 italic">No plans available.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>
      </div>
    </Drawer>
  );
}
