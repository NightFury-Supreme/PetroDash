"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import ProfileSkeleton from "@/components/skeletons/profile/ProfileSkeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  useProfile,
  useProfileEmail,
  useProfile2FA,
  useProfileDelete,
} from "@/hooks/profile";
import {
  ProfileHeader,
  ProfileNav,
  ProfileDrawers,
  ProfileSection,
  Overview,
  Security,
  ActiveSessions,
  ActivityLogSection,
  InvoicesTab,
  ProfileErrorState,
} from "@/components/profile";

export type ProfileDraft = string | { first?: string; last?: string } | null;

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");
  const tAuthErrors = useTranslations("Auth.errors");
  const tErrorBackend = useTranslations("BackendErrors");

  const {
    form,
    setForm,
    loading,
    error,
    saveProfile,
    updatePassword,
    uploadAvatar,
    syncOAuthAvatar,
    resetAvatar,
    sessions,
    sessionsLoading,
    revokeSession,
    resendVerification,
    verifyEmailCode,
  } = useProfile();

  const { showError, showSuccess } = useToast();

  const [section, setSection] = useState<ProfileSection>("overview");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>("");

  const [showChangeEmailDrawer, setShowChangeEmailDrawer] = useState(false);
  const [showEmailVerificationDrawer, setShowEmailVerificationDrawer] = useState(false);
  const [showPasswordDrawer, setShowPasswordDrawer] = useState(false);

  const {
    resendRateLimit,
    setResendRateLimit,
    changeEmail,
    verifyEmailChange,
  } = useProfileEmail({
    onEmailUpdated: (email, emailVerified) => {
      setForm((prev) => ({ ...prev, email, emailVerified }));
    },
  });

  const {
    show2FASetupDrawer,
    setShow2FASetupDrawer,
    show2FADisableDrawer,
    setShow2FADisableDrawer,
    tfaSetupData,
    tfaBackupCodes,
    setTfaBackupCodes,
    tfaLoading,
    start2FASetup,
    verifyAndEnable2FA,
    disable2FA,
  } = useProfile2FA({
    onStatusChanged: (enabled) => {
      setForm((prev) => ({ ...prev, tfaEnabled: enabled }));
    },
  });

  const { deleteOpen, setDeleteOpen, deleteAccount } = useProfileDelete();

  const beginEdit = (field: "username" | "name" | "email") => {
    if (field === "email") {
      setShowChangeEmailDrawer(true);
      return;
    }

    if (field === "name") {
      setEditing(field);
      setDraft({ first: form.firstName || "", last: form.lastName || "" });
      return;
    }

    setEditing(field);
    setDraft(field === "username" ? form.username : "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!editing) return false;

    const updates: { username?: string; firstName?: string; lastName?: string } = {};

    if (editing === "username") {
      const trimmed = (typeof draft === 'string' ? draft : '').trim();
      if (trimmed.length < 3) {
        showError(tAuthErrors("usernameShort"));
        return false;
      }
      updates.username = trimmed;
    }

    if (editing === "name") {
      const draftObj = typeof draft === 'object' && draft !== null ? draft : {};
      const firstName = (draftObj.first || "").trim();
      const lastName = (draftObj.last || "").trim();
      if (!firstName) {
        showError(tAuthErrors("firstNameRequired"));
        return false;
      }
      updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
    }

    try {
      await saveProfile(updates);
      showSuccess(t("profileUpdated"));
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon("error")));
      return false;
    }
  };

  const handleAvatarAction = async (action: () => Promise<unknown>, successMsg: string) => {
    await action();
    showSuccess(t(successMsg));
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeSession(id);
      showSuccess(t("sessionRevoked"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon("error")));
    }
  };

  const handleVerifyEmailClick = async () => {
    if (resendRateLimit > 0) return;
    try {
      await resendVerification();
      setShowEmailVerificationDrawer(true);
    } catch (e: unknown) {
      const retryAfter = (e as { retryAfter?: number })?.retryAfter;
      if (typeof retryAfter === 'number') {
        setResendRateLimit(retryAfter);
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            "email_verify_rate_limited_until",
            (Date.now() + retryAfter * 1000).toString(),
          );
        }
      } else {
        const msg = e instanceof Error ? e.message : '';
        showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon("error")));
      }
    }
  };

  if (error) return <ProfileErrorState error={error} />;

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t("profileSettings")}</h1>
              <p className="text-[#888888] mt-1 text-sm">{t("profileSettingsDesc")}</p>
            </div>
          </div>
        </header>

        <ProfileHeader form={form} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <ProfileNav
            section={section}
            setSection={setSection}
            onOpenDelete={() => setDeleteOpen(true)}
          />

          <div className="flex-1 min-w-0 w-full">
            <div className={section === "overview" ? "block" : "hidden"}>
              <Overview
                form={form}
                editing={editing}
                draft={draft}
                loading={loading}
                onEdit={beginEdit}
                onCancel={cancelEdit}
                onSave={saveEdit}
                onDraft={setDraft}
                onUploadAvatar={(file) => handleAvatarAction(() => uploadAvatar(file), "avatarUpdated")}
                onSyncOAuthAvatar={(provider) => handleAvatarAction(() => syncOAuthAvatar(provider), "avatarSynced")}
                onResetAvatar={() => handleAvatarAction(() => resetAvatar(), "avatarReset")}
                onChangeEmail={() => setShowChangeEmailDrawer(true)}
                setForm={setForm}
              />
            </div>
            {section === "security" && (
              <Security
                emailVerified={form.emailVerified}
                emailVerification={form.emailVerification}
                loginMethod={form.loginMethod}
                tfaEnabled={form.tfaEnabled}
                tfaLoading={tfaLoading}
                loading={loading}
                emailRateLimit={resendRateLimit}
                onChangePassword={() => setShowPasswordDrawer(true)}
                onSetup2FA={start2FASetup}
                onDisable2FA={() => setShow2FADisableDrawer(true)}
                onVerifyEmail={handleVerifyEmailClick}
              />
            )}
            {section === "sessions" && (
              <ActiveSessions sessions={sessions} loading={sessionsLoading} onRevoke={handleRevokeSession} />
            )}
            {section === "activity" && <ActivityLogSection />}
            {section === "invoices" && <InvoicesTab />}
          </div>
        </div>

        <ProfileDrawers
          deleteOpen={deleteOpen}
          setDeleteOpen={setDeleteOpen}
          deleteAccount={deleteAccount}
          form={form}
          showChangeEmailDrawer={showChangeEmailDrawer}
          setShowChangeEmailDrawer={setShowChangeEmailDrawer}
          changeEmail={changeEmail}
          verifyEmailChange={verifyEmailChange}
          showEmailVerificationDrawer={showEmailVerificationDrawer}
          setShowEmailVerificationDrawer={setShowEmailVerificationDrawer}
          verifyEmailCode={verifyEmailCode}
          resendVerification={resendVerification}
          resendRateLimit={resendRateLimit}
          setResendRateLimit={setResendRateLimit}
          showPasswordDrawer={showPasswordDrawer}
          setShowPasswordDrawer={setShowPasswordDrawer}
          updatePassword={updatePassword}
          show2FASetupDrawer={show2FASetupDrawer}
          setShow2FASetupDrawer={setShow2FASetupDrawer}
          tfaSetupData={tfaSetupData}
          tfaBackupCodes={tfaBackupCodes}
          setTfaBackupCodes={setTfaBackupCodes}
          verifyAndEnable2FA={verifyAndEnable2FA}
          show2FADisableDrawer={show2FADisableDrawer}
          setShow2FADisableDrawer={setShow2FADisableDrawer}
          disable2FA={disable2FA}
        />
      </div>
    </div>
  );
}
