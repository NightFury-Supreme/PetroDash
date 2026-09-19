import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# ----------------- VERIFY -----------------
write_file('frontend/src/components/auth/verify/ChangeEmailForm.tsx', """'use client';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import AuthField from '@/components/auth/layout/AuthField';

interface ChangeEmailFormProps {
  newEmail: string;
  setNewEmail: (v: string) => void;
  password?: string;
  setPassword: (v: string) => void;
  tfaCode?: string;
  setTfaCode: (v: string) => void;
  loginMethod: string;
  tfaEnabled: boolean;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ChangeEmailForm({
  newEmail, setNewEmail, password = '', setPassword, tfaCode = '', setTfaCode, loginMethod, tfaEnabled, onSave, onCancel, loading
}: ChangeEmailFormProps) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#888888] mb-6 text-center">Update your account email address.</p>
      
      <div className="space-y-4 text-left">
        <AuthField label="New Email Address" type="email" value={newEmail} onChange={setNewEmail} placeholder="new@example.com" />
        
        {loginMethod === 'email' && (
          <AuthField label="Current Password" type="password" value={password} onChange={setPassword} placeholder="        " />
        )}
        
        {tfaEnabled && (
          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">2FA Code</label>
            <input type="text" maxLength={6} value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\\D/g, ''))} placeholder="123456" className="w-full h-[42px] px-[13px] text-center font-mono tracking-[0.2em] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
          </div>
        )}
        
        <div className="space-y-3 mt-6">
          <AuthSubmit disabled={loading} onClick={onSave}>
            {loading ? 'Updating...' : 'Change Email'}
          </AuthSubmit>
          <button onClick={onCancel} disabled={loading} className="w-full h-[42px] bg-[#222] hover:bg-[#333] disabled:opacity-50 text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
""")

write_file('frontend/src/components/auth/verify/VerifyCodeForm.tsx', """'use client';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';

interface VerifyCodeFormProps {
  email: string;
  code: string;
  setCode: (c: string) => void;
  codeSent: boolean;
  onChangeEmailRequest: () => void;
  onVerify: () => void;
  onResend: () => void;
  loading: boolean;
  resendLoading: boolean;
  rateLimit: number;
}

export default function VerifyCodeForm({
  email, code, setCode, codeSent, onChangeEmailRequest, onVerify, onResend, loading, resendLoading, rateLimit
}: VerifyCodeFormProps) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#888888] mb-6 text-center">
        {codeSent ? 'Enter the 8-digit verification code sent to your email address.' : 'Click the button below to send a verification code to your email address.'}
      </p>
      
      <div className="flex items-center justify-between bg-[#121212] border border-[#282828] rounded-[7px] p-3">
        <div className="text-left truncate pr-2">
          <span className="text-[#888888] block text-[10px] uppercase tracking-wider mb-0.5 font-medium">Email</span>
          <span className="font-medium text-[#d5d5d5] text-[13px]">{email}</span>
        </div>
        <button onClick={onChangeEmailRequest} className="shrink-0 px-3 h-[28px] bg-[#222] hover:bg-[#333] border border-[#333] rounded-[5px] text-[11px] font-medium text-[#aaa] hover:text-white transition-colors">
          Edit
        </button>
      </div>

      {codeSent && (
        <div className="space-y-2 pt-2 text-left">
          <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">Verification Code</label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\\D/g, '').slice(0, 8))} placeholder="00000000" maxLength={8} className="w-full h-[42px] px-[13px] text-center font-mono tracking-[0.2em] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
        </div>
      )}

      <div className="space-y-3 pt-2">
        {codeSent && (
          <AuthSubmit disabled={loading || code.length !== 8} onClick={onVerify}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </AuthSubmit>
        )}
        <button onClick={onResend} disabled={resendLoading || rateLimit > 0} className={`w-full h-[42px] font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2 ${codeSent ? 'bg-[#222] hover:bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed'}`}>
          {resendLoading ? 'Sending...' : rateLimit > 0 ? `Resend in ${Math.floor(rateLimit / 60) > 0 ? `${Math.floor(rateLimit / 60)}m ` : ''}${rateLimit % 60}s` : (codeSent ? 'Resend Code' : 'Send Verification Code')}
        </button>
      </div>

      <div className="mt-6 text-[11px] text-[#888888] text-center">
        Check your email inbox and spam folder for the verification code. The code expires in 15 minutes.
      </div>
    </div>
  );
}
""")

write_file('frontend/src/components/auth/verify/VerifyCoordinator.tsx', """'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import VerifyCodeForm from './VerifyCodeForm';
import ChangeEmailForm from './ChangeEmailForm';

export default function VerifyCoordinator() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  
  const [email, setEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState("");
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [changeMode, setChangeMode] = useState(false);
  
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (rateLimit > 0) {
      const t = setTimeout(() => setRateLimit((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [rateLimit]);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) { router.replace('/login'); return; }
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const res = await fetchWithRetry(`${base}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { localStorage.removeItem("auth_token"); router.replace('/login'); return; }
        const data = await res.json();
        if (!mounted) return;
        if (data.emailVerified) { router.replace('/dashboard'); return; }
        setEmail(data.email || "");
        setLoginMethod(data.loginMethod || "");
        setTfaEnabled(data.tfaEnabled || false);
        setInitialLoading(false);
      } catch (err) {
        if (mounted) router.replace('/login');
      }
    };
    fetchStatus();
    return () => { mounted = false; };
  }, [router]);

  const verifyCode = async () => {
    if (code.length !== 8 || loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/verify`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code })
      });
      if (res.ok) {
        showSuccess('Email verified successfully!');
        setTimeout(() => router.replace('/dashboard'), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || 'Invalid verification code');
      }
    } catch (_e) {
      showError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendLoading || rateLimit > 0) return;
    setResendLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/verify/resend`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRateLimit(60);
        setCodeSent(true);
        showSuccess('Verification code sent successfully!');
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
           const retry = data.retryAfter || 60;
           setRateLimit(retry);
           showError(data.message || `Rate limit exceeded. Please try again in ${Math.ceil(retry/60)} minute(s).`);
        } else {
           showError(data.error || 'Failed to send verification code');
        }
      }
    } catch (_e) {
      showError('Failed to send verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) { showError('Please enter a valid email address'); return; }
    if (loginMethod === 'email' && password.length < 6) { showError('Password must be at least 6 characters'); return; }
    if (tfaEnabled && tfaCode.length !== 6) { showError('Please enter a valid 6-digit 2FA code'); return; }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const payload: any = { email: newEmail };
      if (loginMethod === 'email') payload.password = password;
      if (tfaEnabled) payload.tfaCode = tfaCode;
      
      const res = await fetchWithRetry(`${base}/api/auth/profile/email`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEmail(newEmail);
        setChangeMode(false);
        setPassword("");
        setTfaCode("");
        setCode("");
        showSuccess('Email updated successfully! A new verification code has been sent.');
        setCodeSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || 'Failed to update email');
      }
    } catch {
      showError('Network error while updating email.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="py-12 flex justify-center"><i className="fas fa-spinner fa-spin text-2xl text-[#FF5722]"></i></div>;
  }

  if (changeMode) {
    return (
      <ChangeEmailForm
        newEmail={newEmail} setNewEmail={setNewEmail}
        password={password} setPassword={setPassword}
        tfaCode={tfaCode} setTfaCode={setTfaCode}
        loginMethod={loginMethod} tfaEnabled={tfaEnabled}
        onSave={handleChangeEmail} onCancel={() => setChangeMode(false)}
        loading={loading}
      />
    );
  }

  return (
    <VerifyCodeForm
      email={email} code={code} setCode={setCode}
      codeSent={codeSent}
      onChangeEmailRequest={() => { setChangeMode(true); setNewEmail(email); }}
      onVerify={verifyCode} onResend={resendCode}
      loading={loading} resendLoading={resendLoading} rateLimit={rateLimit}
    />
  );
}
""")
