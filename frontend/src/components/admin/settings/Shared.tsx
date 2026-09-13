import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';

export const PayPalIcon = ({ size }: { size?: number }) => <i className="fab fa-paypal" style={{ fontSize: size, width: size, textAlign: 'center' }}></i>;
export const GoogleIcon = ({ size }: { size?: number }) => <i className="fab fa-google" style={{ fontSize: size, width: size, textAlign: 'center' }}></i>;

export function SideItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-2.5
        py-2
        text-left
        text-sm
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-1
        focus-visible:ring-white/30

        ${
          active
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function SettingsDropdown({
  value,
  options,
  onChange,
  disabled
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (optValue: string) => {
    setOpen(false);
    setLoading(true);
    try {
      await onChange(optValue);
    } finally {
      setLoading(false);
    }
  };

  const activeLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <button
        onClick={() => !disabled && !loading && setOpen(!open)}
        disabled={disabled || loading}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg bg-[#1A1A1A] px-3 text-sm text-[#999] transition-colors hover:bg-[#222] hover:text-[#ddd] disabled:opacity-50"
      >
        <span className="truncate">{activeLabel}</span>
        {loading ? (
          <Loader2 size={14} className="animate-spin opacity-50 shrink-0" />
        ) : (
          <ChevronDown size={14} className="opacity-50 shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-10 z-50 rounded-lg border border-[#222] bg-[#151515] p-1 shadow-xl max-h-[200px] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`flex h-8 w-full items-center rounded px-2 text-left text-sm transition-colors ${
                opt.value === value
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsRow({ 
  icon,
  label, 
  description, 
  children, 
  vertical = false,
  displayValue,
  onSave
}: { 
  icon?: React.ReactNode,
  label: string, 
  description: React.ReactNode, 
  children: React.ReactNode, 
  vertical?: boolean,
  displayValue?: React.ReactNode,
  onSave?: () => Promise<void> | void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      await onSave();
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className={`grid grid-cols-1 gap-4 ${displayValue === undefined ? 'md:grid-cols-[minmax(250px,1fr)_1fr]' : 'md:grid-cols-[minmax(250px,1fr)_1fr_150px]'} md:items-start`}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
              {React.isValidElement(icon) && typeof icon.type !== 'string' ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
            <div className="mt-0.5 text-[13px] text-[#888]">{description}</div>
          </div>
        </div>
        <div className={`flex flex-col w-full justify-center ${displayValue === undefined ? 'md:items-end' : ''}`}>
          {isEditing ? children : (displayValue !== undefined ? (
            <div className="text-sm text-[#D4D4D4] flex items-center md:justify-end h-9">
              {displayValue === 'Enabled' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">Enabled</span>
              ) : displayValue === 'Disabled' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">Disabled</span>
              ) : (
                displayValue
              )}
            </div>
          ) : children)}
        </div>
        {displayValue !== undefined && (
          <div className="flex items-center justify-end gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition"
              >
                <i className="fas fa-pencil-alt text-[10px]"></i> Edit
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleCancel}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition disabled:opacity-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition disabled:cursor-not-allowed bg-[#FF5722] hover:bg-[#F4511E] text-white"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><i className="fas fa-save text-[14px]"></i> Save</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsDrawerRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  onSave,
  children
}: {
  icon?: React.ReactNode,
  label: string,
  description: React.ReactNode,
  enabled?: boolean,
  onToggle?: (enabled: boolean) => Promise<void>,
  onSave: () => Promise<void>,
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-start`}>
         <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
              {React.isValidElement(icon) && typeof icon.type !== 'string' ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
            </div>
          )}
           <div>
             <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
             <div className="mt-0.5 text-[13px] text-[#888]">{description}</div>
           </div>
         </div>
         <div className="flex flex-col w-full justify-center">
            <div className="text-sm text-[#D4D4D4] flex items-center md:justify-end h-9">
              {enabled !== undefined && (
                enabled ? (
                   <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">Enabled</span>
                ) : (
                   <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">Disabled</span>
                )
              )}
            </div>
         </div>
         <div className="flex items-center justify-end gap-2">
            <button onClick={() => setIsOpen(true)} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition">
              <i className="fas fa-pencil-alt text-[10px]"></i> Edit
            </button>
         </div>
      </div>
      
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Configure ${label}`}
        subtitle={typeof description === 'string' ? description : "Update this setting"}
        icon={icon}
        footer={
          <div className="flex items-center justify-between w-full">
            {enabled !== undefined && onToggle ? (
              enabled ? (
                <>
                  <div className="flex items-center gap-2">
                    <button onClick={async () => { setIsSaving(true); await onToggle(false); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-medium transition-all border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50" disabled={isSaving}>
                       {isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14}/> Disable</>}
                    </button>
                  </div>
                  <button onClick={async () => { setIsSaving(true); await onSave(); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button onClick={async () => { setIsSaving(true); await onToggle(true); setIsSaving(false); setIsOpen(false); }} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Enable Integration'}
                </button>
              )
            ) : (
              <div className="flex items-center justify-end w-full">
                <button onClick={async () => { setIsSaving(true); await onSave(); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        }
      >
        {children ? (
          <div className="space-y-5 px-1 py-2">
             {children}
          </div>
        ) : (
          <div className="py-10 text-center flex flex-col items-center">
             <div className="h-12 w-12 rounded-full bg-[#1A1A1A] border border-[#222] flex items-center justify-center text-[#555] mb-4">
                {icon}
             </div>
             <p className="text-[#888] text-sm max-w-[250px] mx-auto">This setting requires no additional configuration. Simply enable or disable it below.</p>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export function SiteIconDisplay({ src }: { src: string }) {
  const [error, setError] = useState(false);
  
  if (error || !src) return <ImageIcon size={16} />;
  return <img src={src} alt="Icon" className="w-full h-full object-cover rounded-md" onError={() => setError(true)} />;
}
