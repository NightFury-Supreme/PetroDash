import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { InfoRow } from "@/components/admin/users/AdminInfoRow";
import { UserAvatar } from "@/components/ui";
import { User, ShieldCheck, Coins, Camera, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { RoleSelectDropdown } from "./RoleSelectDropdown";
import { AvatarUploadDrawer } from "@/components/profile";
import { adminUsersApi } from "@/utils/api/adminUsers";

export interface AdminUserFormData {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role?: string;
  coins?: number;
  profilePicture?: string;
  emailVerified?: boolean;
  [key: string]: unknown;
}

export type AdminOverviewDraft = string | number | { first?: string; last?: string };

interface OverviewTabProps {
  userForm: AdminUserFormData;
  setUserForm: React.Dispatch<React.SetStateAction<AdminUserFormData>>;
  userId: string;
  onUpdateUser: (payload: Record<string, unknown>) => Promise<unknown>;
  onUpdateRole: (newRole: string) => Promise<unknown>;
  onCheckUsername?: (username: string) => Promise<{ available: boolean }>;
  onRefresh?: () => void;
}

export function OverviewTab({
  userForm,
  setUserForm,
  userId,
  onUpdateUser,
  onUpdateRole,
  onCheckUsername,
}: OverviewTabProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminOverviewDraft>("");
  const [showAvatarDrawer, setShowAvatarDrawer] = useState(false);
  const { showSuccess, showError } = useToast();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const beginEdit = (field: string) => {
    setEditing(field);
    if (field === 'name') {
      setDraft({ first: userForm.firstName || '', last: userForm.lastName || '' });
    } else if (field === 'role') {
      setDraft(userForm.role || 'user');
    } else if (field === 'coins') {
      setDraft(userForm.coins || 0);
    } else {
      setDraft(String(userForm[field] || ''));
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };

  const saveEdit = async () => {
    if (!editing) return false;
    try {
      let payload: Record<string, unknown> = {};
      if (editing === 'name') {
        const d = typeof draft === 'object' ? draft : {};
        payload = { firstName: d.first, lastName: d.last };
      } else if (editing === 'coins') {
        payload = { coins: Number(draft) };
      } else {
        payload = { [editing]: draft };
      }

      await onUpdateUser(payload);
      setUserForm((prev) => ({ ...prev, ...payload }));
      setEditing(null);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tCommon('error');
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : msg);
      return false;
    }
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      await onUpdateRole(newRole);
      showSuccess(t('roleUpdated'));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tCommon('error');
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : msg);
      throw e;
    }
  };

  const customInputCls =
    "h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all border-[#FF5722]/50 focus:ring-[#FF5722]/50";

  const draftNameObj = typeof draft === 'object' ? draft : null;

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5">
          <h3 className="text-xl font-semibold tracking-tight text-white">{t('overview')}</h3>
          <p className="mt-2 text-sm text-white/35">{t('overviewDesc')}</p>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <InfoRow
            icon={
              <UserAvatar
                  src={userForm.profilePicture}
                  username={userForm.firstName || userForm.username}
                  email={userForm.email}
                  size={52}
                  rounded="full"
                  className="w-[52px] h-[52px] border-none ring-0 outline-none"
                  fallbackIcon={<Camera size={22} />}
                />
            }
            label={t('avatar')}
            description={t('avatarDesc')}
            value={userForm.profilePicture ? null : t('notSet')}
            editing={false}
            field="avatar"
            onEdit={() => setShowAvatarDrawer(true)}
          />
          <InfoRow
            icon={<User size={14} />}
            label={t('username')}
            description={t('usernameDesc')}
            value={userForm.username || t('notSet')}
            editing={editing === "username"}
            draft={draft}
            field="username"
            onEdit={() => beginEdit("username")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            onCheckUsername={onCheckUsername}
            customEdit={
              <input
                autoFocus
                value={typeof draft === 'string' ? draft : ''}
                onChange={(e) => setDraft(e.target.value)}
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<User size={14} />}
            label={t('fullName')}
            description={t('fullNameDesc')}
            value={
              `${userForm.firstName || ""} ${userForm.lastName || ""}`.trim() ||
              t('notSet')
            }
            editing={editing === "name"}
            draft={draft}
            field="name"
            onEdit={() => beginEdit("name")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <div className="flex w-full gap-2">
                <input
                  autoFocus
                  value={draftNameObj?.first || ''}
                  onChange={(e) =>
                    setDraft({ ...draftNameObj, first: e.target.value })
                  }
                  placeholder={t('firstName')}
                  className={customInputCls}
                />
                <input
                  value={draftNameObj?.last || ''}
                  onChange={(e) =>
                    setDraft({ ...draftNameObj, last: e.target.value })
                  }
                  placeholder={t('lastName')}
                  className={customInputCls}
                />
              </div>
            }
          />
          <InfoRow
            icon={<Mail size={14} />}
            label={t('emailAddress')}
            description={t('emailDesc')}
            value={userForm.email || t('notSet')}
            status={
              userForm.emailVerified ? (
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              ) : undefined
            }
            editing={editing === "email"}
            draft={draft}
            field="email"
            onEdit={() => beginEdit("email")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                autoFocus
                value={typeof draft === 'string' ? draft : ''}
                onChange={(e) => setDraft(e.target.value)}
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<ShieldCheck size={14} />}
            label={t('role')}
            description={t('roleDesc')}
            hideEditButton
            value={
              <RoleSelectDropdown
                currentRole={userForm.role || 'user'}
                onRoleChange={handleRoleChange}
                roleUserLabel={t('roleUser')}
                roleAdminLabel={t('roleAdmin')}
                doneLabel={t('done')}
              />
            }
          />
          <InfoRow
            icon={<Coins size={14} />}
            label={t('coins')}
            description={t('coinsDesc')}
            value={userForm.coins || 0}
            editing={editing === "coins"}
            draft={draft}
            field="coins"
            onEdit={() => beginEdit("coins")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                type="number"
                autoFocus
                value={typeof draft === 'number' || typeof draft === 'string' ? draft : 0}
                onChange={(e) => setDraft(e.target.value)}
                className={customInputCls}
              />
            }
          />
        </div>
      </section>

      <AvatarUploadDrawer
        isOpen={showAvatarDrawer}
        onClose={() => setShowAvatarDrawer(false)}
        currentAvatar={userForm.profilePicture}
        onUpload={async (file) => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
          const { res, data } = await adminUsersApi.uploadAvatar(userId, file, token);
          if (!res.ok) throw new Error(data?.error || data?.message || tCommon('error'));
          setUserForm((prev) => ({ ...prev, profilePicture: data.profilePicture }));
          showSuccess(t('avatarUpdated'));
        }}
        onResetGravatar={async () => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
          const { res, data } = await adminUsersApi.resetAvatar(userId, token);
          if (!res.ok) throw new Error(data?.error || data?.message || tCommon('error'));
          setUserForm((prev) => ({ ...prev, profilePicture: data.profilePicture }));
          showSuccess(t('avatarReset'));
        }}
      />
    </div>
  );
}
