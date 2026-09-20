import React from 'react';

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
  const t = useTranslations('Profile');

  const [editingAvatar, setEditingAvatar] = React.useState(false);
  const [avatarDraft, setAvatarDraft] = React.useState('');
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('overview')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('overviewDesc')}</p>
          </div>
        </div>


        <div className="divide-y divide-white/[0.06]">
          <InfoRow 
            icon={form.profilePicture ? <img src={form.profilePicture} alt="Avatar" className="h-full w-full object-cover rounded-lg" /> : <Camera size={14} />}
            label={t('avatarUrl')}
            description={t('avatarUrlDesc')}
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
          <InfoRow icon={<User size={14} />} label={t('username')} description={t('usernameDesc')} value={form.username || 'Not set'} editing={editing === "username"} draft={draft} field="username" onEdit={() => onEdit("username")} onDraft={onDraft} onSave={onSave} onCancel={onCancel} />
          <InfoRow 
            icon={<User size={14} />} 
            label={t('fullName')} 
            description={t('fullNameDesc')} 
            value={`${form.firstName || ''} ${form.lastName || ''}`.trim() || 'Not set'} 
            editing={editing === "name"} 
            field="name"
            draft={draft}
            customEdit={
              <div className="flex w-full gap-2">
                <input autoFocus value={draft?.first || ''} onChange={(e) => onDraft({ ...draft, first: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} placeholder={t('firstName')} className="h-9 w-full rounded-lg border border-[#FF5722]/50 bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 focus:ring-[#FF5722]/50 transition-all" />
                <input value={draft?.last || ''} onChange={(e) => onDraft({ ...draft, last: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} placeholder={t('lastName')} className="h-9 w-full rounded-lg border border-[#FF5722]/50 bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 focus:ring-[#FF5722]/50 transition-all" />
              </div>
            }
            onEdit={() => onEdit("name")} 
            onSave={onSave} 
            onCancel={onCancel} 
          />
          <InfoRow 
            icon={<Mail size={14} />} 
            label={t('emailAddress')} 
            description={t('emailAddressDesc')} 
            value={form.email || 'Not set'} 
            onEdit={onChangeEmail} 
            status={form.emailVerified ? <ShieldCheck size={16} className="text-emerald-400 shrink-0" /> : (form.emailVerification !== false ? <AlertCircle size={16} className="text-[#FF5722] shrink-0" /> : undefined)} 
          />
        </div>
      </section>
    </div>
  );
}

