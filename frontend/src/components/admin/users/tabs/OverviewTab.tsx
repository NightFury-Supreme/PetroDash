import { fetchWithRetry } from "@/utils/fetchWithRetry";
import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { InfoRow } from "@/components/admin/users/AdminInfoRow";
import { 
  User, ShieldCheck, Coins, Camera, Mail, Check, Loader2, ChevronDown
} from "lucide-react";

export function OverviewTab({ userForm, setUserForm, userId, onRefresh: _onRefresh }: any) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>("");
    const { showError } = useToast();
  
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const beginEdit = (field: string) => {
    setEditing(field);
    if (field === 'name') {
      setDraft({ first: userForm.firstName || '', last: userForm.lastName || '' });
    } else if (field === 'role') {
      setDraft(userForm.role || 'user');
    } else if (field === 'coins') {
      setDraft(userForm.coins || 0);
    } else {
      setDraft(userForm[field] || '');
    }
  };

  const cancelEdit = () => { setEditing(null); setDraft(""); };

  const saveEdit = async () => {
    if (!editing) return false;
    try {
      const token = localStorage.getItem('auth_token');
      let payload: any = {};
      if (editing === 'name') {
        payload = { firstName: draft.first, lastName: draft.last };
      } else if (editing === 'coins') {
        payload = { coins: Number(draft) };
      } else {
        payload = { [editing]: draft };
      }
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (!r.ok) {
        const firstError = d.details?.fieldErrors ? String(Object.values(d.details.fieldErrors).flat()[0]) : d.error || 'Failed to save';
        throw new Error(firstError);
      }
      // update local state optimistically
      if (editing === 'name') {
        setUserForm({ ...userForm, firstName: draft.first, lastName: draft.last });
      } else if (editing === 'coins') {
        setUserForm({ ...userForm, coins: Number(draft) });
      } else {
        setUserForm({ ...userForm, [editing]: draft });
      }
      setEditing(null);
      return true;
    } catch (e: any) {
      showError(e.message || 'Failed to save');
      return false;
    }
  };

  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSaved, setRoleSaved] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    setRoleLoading(true);
    setRoleSaved(false);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (!r.ok) throw new Error('Failed');
      setUserForm({ ...userForm, role: newRole });
      setRoleSaved(true);
      setTimeout(() => setRoleSaved(false), 2000);
    } catch {
      showError('Failed to update role');
    } finally {
      setRoleLoading(false);
    }
  };

  const customInputCls = "h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all border-[#FF5722]/50 focus:ring-[#FF5722]/50";

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5">
          <h3 className="text-xl font-semibold tracking-tight text-white">Overview</h3>
          <p className="mt-2 text-sm text-white/35">Manage user profile information and account details.</p>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <InfoRow 
            icon={userForm.profilePicture ? <img src={userForm.profilePicture} alt="Avatar" className="h-full w-full object-cover rounded-lg" /> : <Camera size={14} />}
            label="Avatar URL"
            description="Profile picture URL."
            value={userForm.profilePicture ? <span className="truncate max-w-[220px] inline-block align-bottom">{userForm.profilePicture}</span> : 'Not set'}
            editing={editing === "profilePicture"}
            field="avatar"
            onEdit={() => beginEdit("profilePicture")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                placeholder="https://example.com/avatar.png"
                className={customInputCls}
              />
            }
          />
          <InfoRow 
            icon={<User size={14} />} 
            label="Username" 
            description="Unique username." 
            value={userForm.username || 'Not set'} 
            editing={editing === "username"} 
            field="username" 
            onEdit={() => beginEdit("username")} 
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />
            }
          />
          <InfoRow 
            icon={<User size={14} />} 
            label="Full name" 
            description="The name displayed on the account." 
            value={`${userForm.firstName || ''} ${userForm.lastName || ''}`.trim() || 'Not set'} 
            editing={editing === "name"} 
            field="name"
            onEdit={() => beginEdit("name")} 
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <div className="flex w-full gap-2">
                <input autoFocus value={draft?.first || ''} onChange={(e) => setDraft({ ...draft, first: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} placeholder="First name" className={customInputCls} />
                <input value={draft?.last || ''} onChange={(e) => setDraft({ ...draft, last: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} placeholder="Last name" className={customInputCls} />
              </div>
            }
          />
          <InfoRow 
            icon={<Mail size={14} />} 
            label="Email address" 
            description="Used for account communication." 
            value={userForm.email || 'Not set'} 
            editing={editing === "email"} 
            field="email" 
            onEdit={() => beginEdit("email")} 
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />
            }
          />
          <InfoRow 
            icon={<ShieldCheck size={14} />} 
            label="Role" 
            description="User's administrative role." 
            hideEditButton
            value={
              <div className="flex items-center gap-3">
                <div className="relative" ref={roleDropdownRef}>
                  <button 
                    onClick={() => !roleLoading && setRoleDropdownOpen(!roleDropdownOpen)}
                    disabled={roleLoading}
                    className={`h-8 w-32 flex items-center justify-between gap-[7px] px-3 border rounded-md text-sm transition-colors disabled:opacity-50 outline-none
                      ${roleDropdownOpen ? 'bg-[#222] border-[#222] text-[#ddd]' : 'bg-[#101010] border-[#2A2A2A] text-[#D4D4D4] hover:border-[#FF5722]/50 hover:text-[#ddd]'}
                    `}
                  >
                    <span className="capitalize">{userForm.role || 'user'}</span>
                    <ChevronDown size={14} className="text-[#858585]" />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-full border border-[#2A2A2A] rounded-md bg-[#151515] p-1.5 shadow-xl">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            if (userForm.role !== 'user') handleRoleChange('user');
                            setRoleDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors
                            ${userForm.role !== 'admin' ? 'text-[#ff5722] bg-[#FF5722]/10' : 'text-[#888] hover:bg-[#222] hover:text-[#ddd]'}
                          `}
                        >
                          User
                          {userForm.role !== 'admin' && <Check size={14} />}
                        </button>
                        <button
                          onClick={() => {
                            if (userForm.role !== 'admin') handleRoleChange('admin');
                            setRoleDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors
                            ${userForm.role === 'admin' ? 'text-[#ff5722] bg-[#FF5722]/10' : 'text-[#888] hover:bg-[#222] hover:text-[#ddd]'}
                          `}
                        >
                          Admin
                          {userForm.role === 'admin' && <Check size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {roleLoading && <Loader2 size={14} className="animate-spin shrink-0 text-white/50" />}
                {roleSaved && <span className="text-emerald-400 shrink-0 flex items-center gap-1 text-[11px]"><Check size={12} strokeWidth={3} /> Done</span>}
              </div>
            }
          />
          <InfoRow 
            icon={<Coins size={14} />} 
            label="Coins" 
            description="User's current coin balance." 
            value={userForm.coins || 0} 
            editing={editing === "coins"} 
            field="coins" 
            onEdit={() => beginEdit("coins")} 
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />
            }
          />
        </div>
      </section>
    </div>
  );
}
