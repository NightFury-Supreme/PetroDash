"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { User, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
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
} from "@/components/profile";

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");
  const tError = useTranslations("BackendErrors");
  const tGlobalError = useTranslations("GlobalErrors");

  const {
    form,
    setForm,
    loading,
    error,
    saveProfile,
    updatePassword,
    updateProfilePicture,
    sessions,
    revokeSession,
    resendVerification,
    verifyEmailCode,
  } = useProfile();

  const { showError, showSuccess } = useToast();

  const [section, setSection] = useState<ProfileSection>("overview");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>("");

  const [showChangeEmailDrawer, setShowChangeEmailDrawer] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
    show2FASetupModal,
    setShow2FASetupModal,
    show2FADisableModal,
    setShow2FADisableModal,
    tfaSetupData,
    tfaBackupCodes,
    setTfaBackupCodes,
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

    let updates: Record<string, string> = {};

    if (editing === "username") {
      const trimmed = (draft || "").trim();
      if (trimmed.length < 3) {
        showError(tGlobalError("usernameTooShort"));
        return false;
      }
      updates = { username: trimmed };
    }

    if (editing === "name") {
      const firstName = (draft?.first || "").trim();
      const lastName = (draft?.last || "").trim();
      if (!firstName) {
        showError(tGlobalError("firstNameEmpty"));
        return false;
      }
      updates = { firstName };
      if (lastName) updates.lastName = lastName;
    }

    try {
      await saveProfile(updates);
      showSuccess(t("profileUpdated"));
      return true;
    } catch (e: any) {
      showError(tError(e.message) || tGlobalError("failedToSaveProfile"));
      return false;
    }
  };

  const handleVerifyEmailClick = async () => {
    if (resendRateLimit > 0) return;
    try {
      await resendVerification();
      setShowEmailVerificationModal(true);
    } catch (e: any) {
      if (e.retryAfter) {
        setResendRateLimit(e.retryAfter);
        localStorage.setItem(
          "email_verify_rate_limited_until",
          (Date.now() + e.retryAfter * 1000).toString(),
        );
      } else {
        showError(tError(e.message) || tGlobalError("failedToSendVerificationEmail"));
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<User strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t("loadError")}
          title={t("failedToLoadProfile")}
          errorString={error}
          description={<ErrorDescription error={error} topic="Profile" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon("retry")}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

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
                onEdit={beginEdit}
                onCancel={cancelEdit}
                onSave={saveEdit}
                onDraft={setDraft}
                onSaveAvatar={async (url) => {
                  try {
                    await updateProfilePicture(url || "");
                    showSuccess(t("profilePictureUpdated"));
                  } catch (e: any) {
                    showError(tError(e.message) || tGlobalError("failedToUpdateProfilePicture"));
                  }
                }}
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
                emailRateLimit={resendRateLimit}
                onChangePassword={() => setShowPasswordModal(true)}
                onSetup2FA={start2FASetup}
                onDisable2FA={() => setShow2FADisableModal(true)}
                onVerifyEmail={handleVerifyEmailClick}
              />
            )}
            {section === "sessions" && (
              <ActiveSessions sessions={sessions} onRevoke={revokeSession} />
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
          showEmailVerificationModal={showEmailVerificationModal}
          setShowEmailVerificationModal={setShowEmailVerificationModal}
          verifyEmailCode={verifyEmailCode}
          resendVerification={resendVerification}
          resendRateLimit={resendRateLimit}
          setResendRateLimit={setResendRateLimit}
          showPasswordModal={showPasswordModal}
          setShowPasswordModal={setShowPasswordModal}
          updatePassword={updatePassword}
          show2FASetupModal={show2FASetupModal}
          setShow2FASetupModal={setShow2FASetupModal}
          tfaSetupData={tfaSetupData}
          tfaBackupCodes={tfaBackupCodes}
          setTfaBackupCodes={setTfaBackupCodes}
          verifyAndEnable2FA={verifyAndEnable2FA}
          show2FADisableModal={show2FADisableModal}
          setShow2FADisableModal={setShow2FADisableModal}
          disable2FA={disable2FA}
        />
      </div>
    </div>
  );
}
