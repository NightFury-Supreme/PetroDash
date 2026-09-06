"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CategorySelect } from './CategorySelect';
import { Upload, Trash2, Plus, Loader2, Check } from 'lucide-react';

type EnvVar = { key: string; value: string };

const INPUT_CLASS = "w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60";

export default function EggForm({ form, setForm, env, setEnv, onSubmit, submitting, onDelete, submitLabel = 'Save', hideFooter = false }: any) {
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setForm((f: any) => ({ ...f, icon: 'pending' }));
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

  const handleRemoveIcon = () => {
    setPendingIconFile(null);
    setIconPreview(null);
    setForm((f: any) => ({ ...f, icon: '' }));
  };

  const handleInterceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingIconFile && !form.icon) {
      alert("Egg icon is required.");
      return;
    }

    setLocalSubmitting(true);
    let finalIcon = form.icon;
    const oldIcon = form.icon !== 'pending' ? form.icon : '';

    if (pendingIconFile) {
      const token = localStorage.getItem('auth_token');
      const fd = new FormData();
      fd.append('icon', pendingIconFile);

      try {
        setUploadingIcon(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });

        setUploadingIcon(false);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Upload failed');
        }

        const data = await res.json();
        finalIcon = data.filePath;

        if (oldIcon) {
          fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ filePath: oldIcon })
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('Failed to upload icon. Please try again.');
        setLocalSubmitting(false);
        setUploadingIcon(false);
        return;
      }
    }

    await onSubmit(e, { ...form, icon: finalIcon });
    setLocalSubmitting(false);
  };

  const isSubmitting = submitting || localSubmitting;

  return (
    <form id="egg-form" onSubmit={handleInterceptSubmit} className="animate-in fade-in duration-300">

      {/* ── SECTION 1: Basic Information ── */}
      <section>
        <h2 className="text-base font-semibold text-white">Basic Information</h2>
        <p className="mt-0.5 text-sm text-[#888]">Configure the egg&apos;s identity and category</p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              Name <span className="text-[#FF5722]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Minecraft Vanilla"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              Category <span className="text-[#FF5722]">*</span>
            </label>
            <CategorySelect
              value={form.category}
              onChange={(cat: string) => setForm((f: any) => ({ ...f, category: cat }))}
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
            onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
            placeholder="Describe this egg..."
            className={`${INPUT_CLASS} min-h-[80px]`}
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
                onChange={(e) => handleFileSelection(e.target.files?.[0])}
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

      {/* ── SECTION 2: Panel Configuration ── */}
      <section className="mt-8">
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
              onChange={(e) => setForm((f: any) => ({ ...f, pterodactylEggId: e.target.value }))}
              placeholder="e.g., 1"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              Pterodactyl Nest ID <span className="text-[#FF5722]">*</span>
            </label>
            <input
              type="number"
              value={form.pterodactylNestId}
              onChange={(e) => setForm((f: any) => ({ ...f, pterodactylNestId: e.target.value }))}
              placeholder="e.g., 1"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Environment Variables ── */}
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
          {env.map((v: EnvVar, idx: number) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <input
                className={`w-full sm:w-1/3 ${INPUT_CLASS}`}
                value={v.key}
                onChange={(e) => setEnv(env.map((x: EnvVar, i: number) => i === idx ? { ...x, key: e.target.value } : x))}
                placeholder="KEY"
              />
              <div className="flex w-full sm:w-2/3 gap-2">
                <input
                  className={`flex-1 ${INPUT_CLASS}`}
                  value={v.value}
                  onChange={(e) => setEnv(env.map((x: EnvVar, i: number) => i === idx ? { ...x, value: e.target.value } : x))}
                  placeholder="VALUE"
                />
                <button
                  type="button"
                  onClick={() => setEnv(env.filter((_: EnvVar, i: number) => i !== idx))}
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

      {/* ── SECTION 4: Permissions & Plans ── */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-base font-semibold text-white">Permissions &amp; Tags</h2>
        </div>
        <p className="text-sm text-[#888]">Configure visibility and deployment rules</p>

        <div className="mt-6 space-y-6">
          {/* Recommended Toggle */}
          <div className="border-t border-white/[0.06]">
            <label className="flex items-center justify-between px-0 py-4 cursor-pointer group hover:bg-transparent transition-colors">
              <input
                type="checkbox"
                className="sr-only"
                checked={!!form.recommended}
                onChange={(e) => setForm((f: any) => ({ ...f, recommended: e.target.checked }))}
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
                          setForm((f: any) => ({ ...f, allowedPlans: f.allowedPlans.filter((v: string) => v !== id && v !== name) }));
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
                {plans.length === 0 && (
                  <div className="py-6 text-center text-xs text-white/25 italic">No plans available.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {!hideFooter && (
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-white/[0.06]">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Delete Egg
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A0F0C] border border-[#FF5722]/30 text-[#FF5722] hover:bg-[#FF5722]/10 transition-all text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {submitLabel}</>}
          </button>
        </div>
      )}
    </form>
  );
}
