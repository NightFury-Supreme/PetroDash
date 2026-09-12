import { SharedLogsTable } from '@/components/ui/SharedLogsTable';
import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@/hooks/useProfile';
import { Pagination } from '@/components/Pagination';
import {
  User,
  Mail,
  ShieldCheck,
  Camera,
  Check,
  Pencil,
  KeyRound,
  Save,
  Smartphone,
  Globe,
  LogOut,
  Clock3,
  Laptop,
  AlertCircle,
} from "lucide-react";

export function SideItem({ icon: Icon, label, active, danger, onClick }: { icon: any; label: string; active?: boolean; danger?: boolean; onClick: () => void; }) {
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
            ? danger 
                ? "bg-red-500/10 text-red-500" 
                : "bg-white/10 text-white"
            : danger
                ? "text-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function Overview({
  form,
  setForm,
  editing,
  draft,
  onEdit,
  onDraft,
  onSave,
  onCancel,
  onSaveAvatar,
  onChangeEmail,
}: {
  form: any;
  setForm: (v: any) => void;
  editing: string | null;
  draft: any;
  onEdit: (f: "username" | "name" | "email") => void;
  onDraft: (v: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onSaveAvatar: (url: string) => void;
  onChangeEmail: () => void;
}) {
  const [editingAvatar, setEditingAvatar] = React.useState(false);
  const [avatarDraft, setAvatarDraft] = React.useState('');
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Overview</h3>
            <p className="mt-2 text-sm text-white/35">Manage your profile information and account details.</p>
          </div>
        </div>


        <div className="divide-y divide-white/[0.06]">
          <InfoRow 
            icon={form.profilePicture ? <img src={form.profilePicture} alt="Avatar" className="h-full w-full object-cover rounded-lg" /> : <Camera size={14} />}
            label="Avatar URL"
            description="Your profile picture URL."
            value={form.profilePicture ? <span className="truncate max-w-[220px] inline-block align-bottom">{form.profilePicture}</span> : 'Not set'}
            editing={editingAvatar}
            draft={avatarDraft}
            forceUnchanged={avatarDraft.trim() === (form.profilePicture || '')}
            field="avatar"
            onEdit={() => {
              setAvatarDraft(form.profilePicture || '');
              setEditingAvatar(true);
            }}
            onCancel={() => setEditingAvatar(false)}
            onSave={() => {
              setForm({ ...form, profilePicture: avatarDraft });
              onSaveAvatar(avatarDraft);
              setEditingAvatar(false);
            }}
            customEdit={
              <input
                autoFocus
                value={avatarDraft}
                onChange={(e) => setAvatarDraft(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              />
            }
          />
          <InfoRow icon={<User size={14} />} label="Username" description="Your unique username." value={form.username || 'Not set'} editing={editing === "username"} draft={draft} field="username" onEdit={() => onEdit("username")} onDraft={onDraft} onSave={onSave} onCancel={onCancel} />
          <InfoRow 
            icon={<User size={14} />} 
            label="Full name" 
            description="The name displayed on your account." 
            value={`${form.firstName || ''} ${form.lastName || ''}`.trim() || 'Not set'} 
            editing={editing === "name"} 
            field="name"
            draft={draft}
            customEdit={
              <div className="flex w-full gap-2">
                <input autoFocus value={draft?.first || ''} onChange={(e) => onDraft({ ...draft, first: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} placeholder="First name" className="h-9 w-full rounded-lg border border-[#FF5722]/50 bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 focus:ring-[#FF5722]/50 transition-all" />
                <input value={draft?.last || ''} onChange={(e) => onDraft({ ...draft, last: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} placeholder="Last name" className="h-9 w-full rounded-lg border border-[#FF5722]/50 bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 focus:ring-[#FF5722]/50 transition-all" />
              </div>
            }
            onEdit={() => onEdit("name")} 
            onSave={onSave} 
            onCancel={onCancel} 
          />
          <InfoRow 
            icon={<Mail size={14} />} 
            label="Email address" 
            description="Used for account communication." 
            value={form.email || 'Not set'} 
            onEdit={onChangeEmail} 
            status={form.emailVerified ? <ShieldCheck size={16} className="text-emerald-400 shrink-0" /> : (form.emailVerification !== false ? <AlertCircle size={16} className="text-[#FF5722] shrink-0" /> : undefined)} 
          />
        </div>
      </section>
    </div>
  );
}

export function Security({ emailVerified, emailVerification, loginMethod, tfaEnabled, emailRateLimit = 0, onChangePassword, onSetup2FA, onDisable2FA, onVerifyEmail }: { emailVerified: boolean; emailVerification: boolean; loginMethod?: string; tfaEnabled: boolean; emailRateLimit?: number; onChangePassword: () => void; onSetup2FA: () => void; onDisable2FA: () => void; onVerifyEmail: () => void; }) {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Security</h3>
            <p className="mt-2 text-sm text-white/35">Protect your account and manage authentication.</p>
          </div>
        </div>


        <div className="divide-y divide-white/[0.06]">
          {loginMethod === 'email' && (
            <SecurityItem icon={<KeyRound size={14} />} title="Password" description="Change your account password." action="Change password" onAction={onChangePassword} />
          )}
          {emailVerification && (
            <SecurityItem 
              icon={<Mail size={14} />} 
              title="Email security" 
              description={emailVerified ? "Your verified email can be used for account recovery." : "Please verify your email address to secure your account."} 
              status={emailVerified ? <ShieldCheck size={16} className="text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-[#FF5722] shrink-0" />} 
              action={
                !emailVerified ? (
                  emailRateLimit > 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-red-400 font-medium">
                        Try after {Math.floor(emailRateLimit / 60) > 0 ? `${Math.floor(emailRateLimit / 60)}m ` : ''}{emailRateLimit % 60}s
                      </span>
                      <button type="button" disabled className="h-8 rounded-md bg-[#222] px-3 text-[11px] font-medium text-[#666] opacity-50 cursor-not-allowed">Verify Email</button>
                    </div>
                  ) : (
                    "Verify Email"
                  )
                ) : undefined
              } 
              onAction={async () => {
                if (!emailVerified && emailRateLimit === 0) {
                  onVerifyEmail();
                }
              }} 
            />
          )}
          <SecurityItem 
            icon={<ShieldCheck size={14} />} 
            title="Two-Factor Authentication" 
            description={tfaEnabled ? "Your account is secured with 2FA." : "Add an extra layer of security to your account."} 
            action={
              <button
                type="button"
                role="switch"
                aria-checked={tfaEnabled}
                onClick={tfaEnabled ? onDisable2FA : onSetup2FA}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${tfaEnabled ? 'bg-[#FF5722]' : 'bg-[#333]'}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${tfaEnabled ? 'translate-x-2' : '-translate-x-2'}`}
                />
              </button>
            } 
          />
        </div>
      </section>

    </div>
  );
}

export function ActiveSessions({ sessions, onRevoke }: { sessions: Session[]; onRevoke: (id: string) => void; }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#222] bg-[#161616] p-4">
        <div className="flex gap-3">
          <Clock3 size={16} className="mt-0.5 shrink-0 text-[#666]" />
          <p className="text-xs text-[#888]">If you do not recognize a device or location, revoke its session and change your password.</p>
        </div>
      </div>
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Active Sessions</h3>
            <p className="mt-2 text-sm text-white/35">Review devices currently signed into your account.</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-white/5">
              <Laptop size={18} className="text-[#888]" />
            </div>
            <p className="text-sm font-semibold text-[#D4D4D4]">No active sessions</p>
            <p className="mt-1 text-xs text-[#888]">There are no other authenticated devices.</p>
          </div>
        ) : (
          <>
            <div className="hidden gap-4 grid-cols-[minmax(250px,1fr)_1fr_150px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
              <span>Device</span>
              <span className="md:text-right">Details</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {sessions.map((session) => <SessionRow key={session.id} session={session} onRevoke={() => onRevoke(session.id)} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SessionRow({ session, onRevoke }: { session: Session; onRevoke: () => void; }) {
  const DeviceIcon = session.deviceType === "mobile" || session.deviceType === "tablet" ? Smartphone : Laptop;
  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#222] border border-[#2A2A2A]">
            <DeviceIcon size={18} className="text-[#D4D4D4]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#D4D4D4]">{session.device}</p>
              {session.current && <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-400">This device</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center md:justify-end min-w-0">
          <div className="flex flex-wrap items-center md:justify-end gap-x-3 gap-y-1 text-xs text-[#888]">
            <span className="truncate max-w-[200px]" title={session.browser}>{session.browser?.includes('Mozilla') ? parseUserAgent(session.browser) : session.browser}</span>
            <span className="text-[#444]">·</span>
            <span className="flex items-center gap-1"><Globe size={12} /> {session.ip || 'Unknown'}</span>
            <span className="text-[#444]">·</span>
            <span>{session.lastActive ? new Date(session.lastActive).toLocaleString() : 'Unknown'}</span>
            <span className="text-[#444]">·</span>
            <span className="font-mono text-[10px]">ID: {session.id}</span>
          </div>
        </div>
        <div className="flex items-center justify-end">
          {!session.current && (
            <button type="button" onClick={onRevoke} className="flex h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-md border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-[11px] font-medium text-[#888] hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition-all sm:self-auto">
              <LogOut size={11} /> Sign out
            </button>
          )}
          {session.current && (
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active now
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function InfoRow({ icon, label, description, value, editing, draft, field, status, action, customEdit, onEdit, onDraft, onSave, onCancel, forceUnchanged }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [touched, setTouched] = useState(false);

  // Username availability check state
  const [usernameAvail, setUsernameAvail] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usernameVal = typeof draft === 'string' ? draft : '';
  const firstNameVal = draft?.first ?? '';
  const lastNameVal = draft?.last ?? '';
  const isUnchanged = forceUnchanged !== undefined ? forceUnchanged : (typeof draft === 'string' ? draft.trim() === (value || '') : false);

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
      : field === 'avatar' && editing
      ? (() => {
          if (!usernameVal.trim()) return { valid: true, message: '' }; // empty is allowed
          try {
            new URL(usernameVal.trim());
            return { valid: true, message: '' };
          } catch {
            return { valid: false, message: 'Invalid URL format.' };
          }
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
        const res = await fetch(
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
        <div className="flex items-center gap-3">
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
              {validation && (touched || usernameAvail !== 'idle' || field === 'avatar') && validation.message && (
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
            <div className="flex min-w-0 items-center md:justify-end gap-2 h-9">
              <span className="truncate text-sm text-[#D4D4D4]">{value}</span>
              {status && (typeof status === 'string' ? (
                <span className="shrink-0 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">{status}</span>
              ) : status)}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
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
            <button type="button" onClick={onEdit} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition"><Pencil size={14} /> Edit</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SecurityItem({ icon, title, description, action, status, onAction }: any) {
  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#222] border border-[#2A2A2A] text-[#D4D4D4]">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#D4D4D4]">{title}</p>
            <p className="mt-1 text-xs text-[#888]">{description}</p>
          </div>
        </div>
        <div className="flex items-center md:justify-end min-w-0">
          {status && (typeof status === 'string' ? <span className="shrink-0 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">{status}</span> : status)}
        </div>
        <div className="flex items-center justify-end gap-3 shrink-0">
          {action && (
            typeof action === 'string' ? (
              <button type="button" onClick={onAction} className="shrink-0 h-9 rounded-lg border border-[#222] bg-[#1A1A1A] px-4 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition">
                {action}
              </button>
            ) : action
          )}
        </div>
      </div>
    </div>
  );
}

function parseUserAgent(ua: string): string {
  if (!ua) return 'Unknown Device';
  
  let browser = 'Unknown Browser';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${os} • ${browser}`;
}

export function ActivityLogSection() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);
  const LOGS_PER_PAGE = 10;

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/activity?page=${page}&limit=${LOGS_PER_PAGE}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    .then(r => r.json())
    .then(data => {
      if (active && data.success) {
        setLogs(data.data);
        setTotalLogs(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      }
      if (active) setLoading(false);
    })
    .catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page]);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Activity Log</h3>
            <p className="mt-2 text-sm text-white/35">Review recent events and actions on your account.</p>
          </div>
        </div>
        
        <div className="mt-2">
          <SharedLogsTable logs={logs} loading={loading} variant="user" />
        </div>

        {/* PAGINATION */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalLogs}
          pageSize={LOGS_PER_PAGE}
          onPageChange={setPage}
          loading={loading}
          itemName="events"
        />
      </section>
    </div>
  );
}

