import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { User, Mail, ShieldCheck, Camera, AlertCircle } from "lucide-react";
import { InfoRow } from '../ui/InfoRow';
import { UserAvatar } from '@/components/ui';
import { ProfileFormData } from '@/hooks/profile';
import { AvatarUploadDrawer } from '../drawers/AvatarUploadDrawer';
import { OverviewSkeleton } from '@/components/skeletons/profile';

export type ProfileDraft = string | { first?: string; last?: string } | null;

export interface OverviewProps {
  form: ProfileFormData;
  setForm: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  editing: string | null;
  draft: ProfileDraft;
  loading?: boolean;
  onEdit: (field: "username" | "name" | "email") => void;
  onDraft: (draft: ProfileDraft) => void;
  onSave: () => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onSyncOAuthAvatar: (provider: 'discord' | 'google') => Promise<void>;
  onResetAvatar: () => Promise<void>;
  onChangeEmail: () => void;
}

export function Overview({
  form,
  editing,
  draft,
  loading = false,
  onEdit,
  onDraft,
  onSave,
  onCancel,
  onUploadAvatar,
  onSyncOAuthAvatar,
  onResetAvatar,
  onChangeEmail,
}: OverviewProps) {
  const t = useTranslations('Profile');
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);

  const nameDraftObj = typeof draft === 'object' && draft !== null ? draft : null;

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('overview')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('overviewDesc')}</p>
          </div>
        </div>

        {loading ? (
          <OverviewSkeleton />
        ) : (
          <div className="divide-y divide-white/[0.06]">
          <InfoRow 
            icon={
              <UserAvatar
                src={form.profilePicture}
                username={form.firstName || form.username}
                email={form.email}
                size={52}
                rounded="full"
                fallbackIcon={<Camera size={22} />}
                className="w-[52px] h-[52px] border-none ring-0 outline-none"
              />
            }
            label={t('avatar')}
            description={t('avatarDesc')}
            value={form.profilePicture ? null : t('notSet')}
            editing={false}
            field="avatar"
            onEdit={() => setShowUploadDrawer(true)}
          />
          <InfoRow
            icon={<User size={14} />}
            label={t('username')}
            description={t('usernameDesc')}
            value={form.username || t('notSet')}
            editing={editing === "username"}
            draft={draft}
            field="username"
            onEdit={() => onEdit("username")}
            onDraft={onDraft}
            onSave={onSave}
            onCancel={onCancel}
          />
          <InfoRow 
            icon={<User size={14} />} 
            label={t('fullName')} 
            description={t('fullNameDesc')} 
            value={`${form.firstName || ''} ${form.lastName || ''}`.trim() || t('notSet')} 
            editing={editing === "name"} 
            field="name"
            draft={draft}
            customEdit={
              <div className="flex w-full gap-2">
                <input
                  autoFocus
                  value={nameDraftObj?.first || ''}
                  onChange={(e) => onDraft({ ...nameDraftObj, first: e.target.value })}
                  placeholder={t('firstName')}
                  className="h-9 w-full rounded-lg border border-[#FF5722]/50 bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 focus:ring-[#FF5722]/50 transition-all"
                />
                <input
                  value={nameDraftObj?.last || ''}
                  onChange={(e) => onDraft({ ...nameDraftObj, last: e.target.value })}
                  placeholder={t('lastName')}
                  className="h-9 w-full rounded-lg border border-[#FF5722]/50 bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 focus:ring-[#FF5722]/50 transition-all"
                />
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
            value={form.email || t('notSet')} 
            onEdit={onChangeEmail} 
            status={form.emailVerified ? <ShieldCheck size={16} className="text-emerald-400 shrink-0" /> : (form.emailVerification !== false ? <AlertCircle size={16} className="text-[#FF5722] shrink-0" /> : undefined)} 
          />
        </div>
      )}
      </section>

      <AvatarUploadDrawer
        isOpen={showUploadDrawer}
        onClose={() => setShowUploadDrawer(false)}
        currentAvatar={form.profilePicture}
        hasDiscord={Boolean(form.oauthProviders?.discord)}
        hasGoogle={Boolean(form.oauthProviders?.google)}
        onUpload={onUploadAvatar}
        onSyncOAuth={onSyncOAuthAvatar}
        onResetGravatar={onResetAvatar}
      />
    </div>
  );
}
