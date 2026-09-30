import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { InfoRow } from "@/components/admin/users/AdminInfoRow";
import { User, ShieldCheck, Coins, Camera, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { RoleSelectDropdown } from "./RoleSelectDropdown";

interface OverviewTabProps {
  userForm: any;
  setUserForm: React.Dispatch<React.SetStateAction<any>>;
  userId: string;
  onUpdateUser: (payload: Record<string, any>) => Promise<any>;
  onUpdateRole: (newRole: string) => Promise<any>;
  onCheckUsername?: (username: string) => Promise<{ available: boolean }>;
  onRefresh?: () => void;
}

export function OverviewTab({
  userForm,
  setUserForm,
  userId: _userId,
  onUpdateUser,
  onUpdateRole,
  onCheckUsername,
  onRefresh: _onRefresh,
}: OverviewTabProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>("");
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
      setDraft(userForm[field] || '');
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };

  const saveEdit = async () => {
    if (!editing) return false;
    try {
      let payload: Record<string, any> = {};
      if (editing === 'name') {
        payload = { firstName: draft.first, lastName: draft.last };
      } else if (editing === 'coins') {
        payload = { coins: Number(draft) };
      } else {
        payload = { [editing]: draft };
      }

      await onUpdateUser(payload);

      if (editing === 'name') {
        setUserForm((prev: any) => ({ ...prev, firstName: draft.first, lastName: draft.last }));
      } else if (editing === 'coins') {
        setUserForm((prev: any) => ({ ...prev, coins: Number(draft) }));
      } else {
        setUserForm((prev: any) => ({ ...prev, [editing]: draft }));
      }
      setEditing(null);
      return true;
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
      return false;
    }
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      await onUpdateRole(newRole);
      showSuccess(t('roleUpdated'));
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
      throw e;
    }
  };

  const customInputCls =
    "h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all border-[#FF5722]/50 focus:ring-[#FF5722]/50";

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
              userForm.profilePicture ? (
                <img
                  src={userForm.profilePicture}
                  alt={tCommon('avatar')}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <Camera size={14} />
              )
            }
            label={t('avatarUrl')}
            description={t('avatarDesc')}
            value={
              userForm.profilePicture ? (
                <span className="truncate max-w-[220px] inline-block align-bottom text-sm text-[#D4D4D4]">{userForm.profilePicture}</span>
              ) : (
                t('notSet')
              )
            }
            editing={editing === "profilePicture"}
            draft={draft}
            field="avatar"
            onEdit={() => beginEdit("profilePicture")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                
                placeholder={t('placeholderAvatarUrl')}
                className={customInputCls}
              />
            }
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
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<User size={14} />}
            label={t('fullName')}
            description={t('fullNameDesc')}
            value={`${userForm.firstName || ''} ${userForm.lastName || ''}`.trim() || t('notSet')}
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
                  value={draft?.first || ''}
                  onChange={(e) => setDraft({ ...draft, first: e.target.value })}
                  
                  placeholder={t('firstName')}
                  className={customInputCls}
                />
                <input
                  value={draft?.last || ''}
                  onChange={(e) => setDraft({ ...draft, last: e.target.value })}
                  
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
                value={draft}
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
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                
                className={customInputCls}
              />
            }
          />
        </div>
      </section>
    </div>
  );
}
