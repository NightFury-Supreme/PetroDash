"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import React, { useState } from "react";
import { useProfile } from '@/hooks/useProfile';
import ProfileSkeleton from '@/components/skeletons/profile/ProfileSkeleton';
import { useToast } from '@/components/ui/ToastProvider';
import { 
  EmailVerificationDrawer,
  PasswordDrawer, 
  Setup2FADrawer, 
  Disable2FADrawer, 
  DeleteAccountDrawer,
  ChangeEmailDrawer
} from '@/components/profile/ProfileDrawers';
import { 
  SideItem, 
  Overview, 
  Security, 
  ActiveSessions,
  ActivityLogSection
} from '@/components/profile/ProfileComponents';
import { InvoicesTab } from '@/components/profile/InvoicesTab';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Coins,
  Check,
  Trash2,
  Monitor,
  Activity,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";

type Section = "overview" | "security" | "sessions" | "activity" | "invoices";

export default function ProfilePage() {
  const { form, setForm, loading, error, saveProfile, updatePassword, updateProfilePicture, sessions, revokeSession, resendVerification, verifyEmailCode } = useProfile();

  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [section, setSection] = useState<Section>("overview");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>("");

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [showChangeEmailDrawer, setShowChangeEmailDrawer] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [resendRateLimit, setResendRateLimit] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  
  const [tfaSetupData, setTfaSetupData] = useState<{ secret: string, qrCodeUrl: string } | null>(null);
  const [tfaBackupCodes, setTfaBackupCodes] = useState<string[] | null>(null);

  React.useEffect(() => {
    if (resendRateLimit > 0) {
      const timer = setTimeout(() => setResendRateLimit(resendRateLimit - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendRateLimit]);

  const beginEdit = (field: "username" | "name" | "email") => {
    if (field === "email") {
      setShowChangeEmailDrawer(true);
      return;
    }

    if (field === "name") {
      setEditing(field);
      setDraft({ first: form.firstName || '', last: form.lastName || '' });
      return;
    }

    let value = '';
    if (field === "username") value = form.username;
    
    setEditing(field);
    setDraft(value || '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!editing) return false;

    let updates: Record<string, string> = {};

    if (editing === "username") {
      const trimmed = (draft || '').trim();
      if (trimmed.length < 3) {
        showError('Username must be at least 3 characters.');
        return false;
      }
      updates = { username: trimmed };
    }

    if (editing === "name") {
      const firstName = (draft?.first || '').trim();
      const lastName = (draft?.last || '').trim();
      // Backend requires min 1 char for each field when provided
      if (!firstName) {
        showError('First name cannot be empty.');
        return false;
      }
      // Only send lastName if it's non-empty (backend min(1) validation)
      updates = { firstName };
      if (lastName) updates.lastName = lastName;
    }

    try {
      await saveProfile(updates);
      showSuccess("Profile updated successfully.");
      return true;
    } catch (e: any) {
      showError(e.message || 'Failed to save profile. Please try again.');
      return false;
    }
  };

  const changeEmail = async (newEmail: string, password: string, tfaCode: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: newEmail, password: password || undefined, tfaCode: tfaCode || undefined })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update email');
    
    if (data.requiresVerification) {
      return { requiresVerification: true };
    }
    
    // Refresh the user profile to get the new email and updated emailVerified status
    const profileRes = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (profileRes.ok) {
      const pData = await profileRes.json();
      setForm(prev => ({
        ...prev,
        email: pData.email || prev.email,
        emailVerified: Boolean(pData.emailVerified)
      }));
    }
    return { requiresVerification: false };
  };

  const verifyEmailChange = async (newEmail: string, code: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: newEmail, code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify email change');
    
    const profileRes = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (profileRes.ok) {
      const pData = await profileRes.json();
      setForm(prev => ({
        ...prev,
        email: pData.email || prev.email,
        emailVerified: Boolean(pData.emailVerified)
      }));
    }
  };

  const deleteAccount = async (password?: string, tfaCode?: string) => {
    const token = localStorage.getItem('auth_token');
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile`, { 
      method: 'DELETE', 
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ password: password || undefined, tfaCode: tfaCode || undefined })
    });
    let d: any = {}; try { d = await r.json(); } catch {} 
    if (!r.ok) throw new Error(d?.error || 'Failed to delete account');
    
    setTimeout(() => {
      localStorage.removeItem('auth_token');
      router.push('/register');
    }, 1000);
  };

  const handleVerifyEmailClick = async () => {
    if (resendRateLimit > 0) return;
    try {
      await resendVerification();
      setShowEmailVerificationModal(true);
    } catch (e: any) {
      if (e.retryAfter) {
        setResendRateLimit(e.retryAfter);
        localStorage.setItem('email_verify_rate_limited_until', (Date.now() + e.retryAfter * 1000).toString());
      } else {
        showError(e.message || 'Failed to send verification email. Please try again.');
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<User strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Profile"
          errorString={error}
          description={<ErrorDescription error={error} topic="Profile" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  if (loading) return <ProfileSkeleton />;

  const start2FASetup = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Failed to setup 2FA');
        return;
      }
      setTfaSetupData(data);
      setTfaBackupCodes(null);
      setShow2FASetupModal(true);
    } catch {
      showError('Could not connect to the server. Please try again.');
    }
  };

  // Called from the drawer — throws on error so the drawer can handle loading state
  const verifyAndEnable2FA = async (code: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/enable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid verification code');
    setTfaBackupCodes(data.backupCodes);
    setForm(f => ({ ...f, tfaEnabled: true }));
  };

  // Called from the drawer — throws on error so the drawer can handle loading state
  const disable2FA = async (password: string, code: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: password || undefined, code: code || undefined })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA');
    setForm(f => ({ ...f, tfaEnabled: false }));
    setShow2FADisableModal(false);
  };

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Profile Settings</h1>
              <p className="text-[#888888] mt-1 text-sm">Manage your account details and security preferences.</p>
            </div>
          </div>
        </header>

        <section className="border-b border-white/[0.06] pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-[#2A2A2A] bg-[#222]">
                  {form.profilePicture ? (
                    <img src={form.profilePicture} alt={form.username} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-2xl text-[#D4D4D4]">
                       {(form.firstName || form.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {form.emailVerification && form.emailVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#161616] bg-emerald-500">
                    <Check size={11} strokeWidth={3} className="text-white" />
                  </span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-[#D4D4D4]">
                    {`${form.firstName || ''} ${form.lastName || ''}`.trim() || form.username || 'User'}
                  </h2>
                  {form.emailVerification && form.emailVerified && (
                    <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#888]">
                  @{form.username || 'username'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <Coins size={16} className="text-[#FF5722]" />
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-[#666]">Balance</span>
                  <span className="text-sm font-medium text-[#D4D4D4]">{form.coins || 0} coins</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="sticky top-6">
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Account</p>
              </div>
              <nav className="space-y-1">
                <SideItem icon={User} label="Overview" active={section === "overview"} onClick={() => setSection("overview")} />
                <SideItem icon={ShieldCheck} label="Security" active={section === "security"} onClick={() => setSection("security")} />
                <SideItem icon={Monitor} label="Active sessions" active={section === "sessions"} onClick={() => setSection("sessions")} />
                <SideItem icon={Activity} label="Activity log" active={section === "activity"} onClick={() => setSection("activity")} />
                <SideItem icon={CreditCard} label="Invoices" active={section === "invoices"} onClick={() => setSection("invoices")} />
              </nav>
              
              <div className="mt-8 border-t border-[#333] pt-6 mb-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Account actions</p>
              </div>
              <nav className="space-y-1">
                <SideItem icon={Trash2} label="Delete account" danger active={false} onClick={() => setDeleteOpen(true)} />
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            {section === "overview" && <Overview form={form} editing={editing} draft={draft} onEdit={beginEdit} onCancel={cancelEdit} onSave={saveEdit} onDraft={setDraft} onSaveAvatar={async (url) => {
                  try {
                    await updateProfilePicture(url || '');
                    showSuccess("Profile picture updated.");
                  } catch (e: any) {
                    showError(e.message || "Failed to update profile picture.");
                  }
                }} onChangeEmail={() => setShowChangeEmailDrawer(true)} setForm={setForm} />}
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

        <DeleteAccountDrawer
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={deleteAccount}
          loginMethod={form.loginMethod}
          tfaEnabled={form.tfaEnabled}
        />
        
        <ChangeEmailDrawer
          isOpen={showChangeEmailDrawer}
          onClose={() => setShowChangeEmailDrawer(false)}
          tfaEnabled={form.tfaEnabled}
          changeEmail={changeEmail}
          verifyEmailChange={verifyEmailChange}
        />

        <EmailVerificationDrawer
          isOpen={showEmailVerificationModal}
          onClose={() => setShowEmailVerificationModal(false)}
          email={form.email}
          onVerify={verifyEmailCode}
          onResend={resendVerification}
          rateLimit={resendRateLimit}
          onRateLimitChange={setResendRateLimit}
          onChangeEmail={() => {
            setShowEmailVerificationModal(false);
            setShowChangeEmailDrawer(true);
          }}
        />
        
        <PasswordDrawer
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          tfaEnabled={form.tfaEnabled}
          updatePassword={updatePassword}
        />

        <Setup2FADrawer
          isOpen={show2FASetupModal}
          onClose={() => setShow2FASetupModal(false)}
          tfaSetupData={tfaSetupData}
          tfaBackupCodes={tfaBackupCodes}
          setTfaBackupCodes={setTfaBackupCodes}
          verifyAndEnable2FA={verifyAndEnable2FA}
        />

        <Disable2FADrawer
          isOpen={show2FADisableModal}
          onClose={() => setShow2FADisableModal(false)}
          disable2FA={disable2FA}
        />
      </div>
    </div>
  );
}



