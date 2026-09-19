import { fetchWithRetry } from "@/utils/fetchWithRetry";
import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Pencil, Save } from 'lucide-react';

export function InfoRow({ icon, label, description, value, editing, draft, field, status, action, customEdit, onEdit, onDraft, onSave, onCancel, hideEditButton }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [touched, setTouched] = useState(false);

  // Username availability check state
  const [usernameAvail, setUsernameAvail] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usernameVal = typeof draft === 'string' ? draft : '';
  const firstNameVal = draft?.first ?? '';
  const lastNameVal = draft?.last ?? '';
  const isUnchanged = typeof draft === 'string' ? draft.trim() === (value || '') : false;

  // Format-only validation (no availability)
  const formatValid: { valid: boolean; message: string } | null =
    field === 'username' && editing
      ? (() => {
          if (!usernameVal.trim()) return { valid: false, message: 'Username cannot be empty.' };
          if (usernameVal.trim().length < 3) return { valid: false, message: 'Username must be at least 3 characters.' };
          if (usernameVal.trim().length > 30) return { valid: false, message: 'Username cannot exceed 30 characters.' };
          if (!/^[a-zA-Z0-9_]+$/.test(usernameVal.trim())) return { valid: false, message: 'Use only letters, numbers and underscores.' };
          return { valid: true, message: '' };
        })()
      : field === 'name' && editing
      ? (() => {
          if (!firstNameVal.trim()) return { valid: false, message: 'First name is required.' };
          if (!lastNameVal.trim()) return { valid: false, message: 'Last name is required.' };
          return { valid: true, message: 'Name looks good.' };
        })()
      : null;

  // Debounced availability check — fires only when format is valid
  useEffect(() => {
    if (field !== 'username' || !editing) return;
    if (!formatValid?.valid || usernameVal.trim() === (value || '')) { 
      setUsernameAvail('idle'); 
      return; 
    }

    setUsernameAvail('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/check-username?username=${encodeURIComponent(usernameVal.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setUsernameAvail(data.available ? 'available' : 'taken');
      } catch {
        setUsernameAvail('error');
      }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [usernameVal, field, editing, formatValid?.valid]);

  // Reset avail check when editing starts/stops
  useEffect(() => {
    if (!editing) { setUsernameAvail('idle'); setTouched(false); }
  }, [editing]);

  // Final combined validation shown to the user
  const validation: { valid: boolean; message: string } | null =
    field === 'username' && editing
      ? (() => {
          if (!formatValid?.valid) return formatValid;
          if (usernameAvail === 'checking') return { valid: true, message: 'Checking availability…' };
          if (usernameAvail === 'taken') return { valid: false, message: 'Username is already taken.' };
          if (usernameAvail === 'available') return { valid: true, message: 'Username is available.' };
          if (usernameAvail === 'error') return { valid: false, message: 'Error checking availability.' };
          return { valid: true, message: '' };
        })()
      : formatValid;

  const canSave = isUnchanged ? false : (
    field === 'username'
      ? (formatValid?.valid && usernameAvail === 'available')
      : (validation?.valid ?? true)
  );

  const handleSave = async () => {
    setTouched(true);
    if (!canSave) return;
    setIsLoading(true);
    try {
      const success = await onSave();
      if (success !== false) {
        setIsSaved(true);
        setTimeout(() => { setIsSaved(false); onCancel(); }, 1000);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-start">
        <div className="flex items-center gap-3 md:mt-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#222] border border-[#2A2A2A] text-[#D4D4D4]">
            {React.isValidElement(icon) && typeof icon.type !== 'string' ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
            <p className="mt-0.5 text-[13px] text-[#888]">{description}</p>
          </div>
        </div>
        <div>
          {editing ? (
            <>
              {customEdit ? customEdit : (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => { onDraft(e.target.value); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  disabled={isLoading}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSave(); if (e.key === 'Escape' && !isLoading) onCancel(); }}
                  className={`h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                    touched && validation && !validation.valid
                      ? 'border-red-400/30 focus:ring-red-400/20'
                      : 'border-[#FF5722]/50 focus:ring-[#FF5722]/50'
                  }`}
                />
              )}
              {validation && (touched || usernameAvail !== 'idle') && validation.message && (
                <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${validation.valid ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                  {usernameAvail === 'checking'
                    ? <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" />
                    : validation.valid ? <Check size={11} /> : <AlertCircle size={11} />
                  }
                  <span>{validation.message}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-w-0 items-center gap-2 md:mt-2">
              {React.isValidElement(value) ? value : <span className="truncate text-sm text-[#D4D4D4]">{value}</span>}
              {status && (typeof status === 'string' ? (
                <span className="shrink-0 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">{status}</span>
              ) : status)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 md:mt-1">
          {action}
          {editing ? (
            <>
              <button type="button" onClick={onCancel} disabled={isLoading || isSaved} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleSave} disabled={isLoading || isSaved || !canSave} className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition disabled:cursor-not-allowed ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : (isLoading || !canSave) ? 'bg-[#333] text-[#888]' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white'}`}>
                {isLoading && !isSaved ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : isSaved ? (
                  <Check size={14} />
                ) : (
                  <Save size={14} />
                )}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </>
          ) : (
            !hideEditButton && <button type="button" onClick={onEdit} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition"><Pencil size={14} /> Edit</button>
          )}
        </div>
      </div>
    </div>
  );
}
