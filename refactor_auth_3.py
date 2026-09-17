import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# ----------------- FORGOT -----------------
write_file('frontend/src/components/auth/forgot/ForgotRequestForm.tsx', """'use client';
import { useRouter } from 'next/navigation';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import AuthField from '@/components/auth/layout/AuthField';

interface ForgotRequestFormProps {
  email: string;
  setEmail: (e: string) => void;
  onRequest: () => void;
  loading: boolean;
}

export default function ForgotRequestForm({ email, setEmail, onRequest, loading }: ForgotRequestFormProps) {
  const router = useRouter();
  
  return (
    <div className="space-y-4">
      <AuthField label="Email" value={email} onChange={setEmail} placeholder="your@email.com" />
      <div className="space-y-3 pt-2">
        <AuthSubmit disabled={loading || !email} onClick={onRequest}>
          {loading ? 'Sending...' : 'Send Reset Code'}
        </AuthSubmit>
      </div>
      <div className="mt-6 text-[12px] text-[#888888] text-left">
        Remembered your password? <button onClick={() => router.replace('/login')} className="text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium">Login</button>
      </div>
    </div>
  );
}
""")

write_file('frontend/src/components/auth/forgot/ForgotResetForm.tsx', """'use client';
import { useRouter } from 'next/navigation';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import AuthField from '@/components/auth/layout/AuthField';

interface ForgotResetFormProps {
  email: string;
  setEmail: (e: string) => void;
  code: string;
  setCode: (c: string) => void;
  password: string;
  setPassword: (p: string) => void;
  confirm: string;
  setConfirm: (c: string) => void;
  onReset: () => void;
  onResend: () => void;
  loading: boolean;
  resendLoading: boolean;
  rateLimit: number;
}

export default function ForgotResetForm({
  email, setEmail, code, setCode, password, setPassword, confirm, setConfirm, onReset, onResend, loading, resendLoading, rateLimit
}: ForgotResetFormProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <AuthField label="Email" value={email} onChange={setEmail} placeholder="your@email.com" />
      
      <div className="space-y-2 text-left">
        <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">Verification Code</label>
        <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\\D/g, '').slice(0, 8))} placeholder="00000000" maxLength={8} className="w-full h-[42px] px-[13px] text-center font-mono tracking-widest bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" style={{ letterSpacing: '0.5em' }} />
      </div>
      
      <AuthField type="password" label="New Password" value={password} onChange={setPassword} placeholder="At least 12 characters" />
      <AuthField type="password" label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" />

      <div className="space-y-3 pt-2">
        <AuthSubmit disabled={loading || code.length !== 8 || !password || password !== confirm} onClick={onReset}>
          {loading ? 'Updating...' : 'Reset Password'}
        </AuthSubmit>
        <button onClick={onResend} disabled={resendLoading || rateLimit > 0} className="w-full h-[42px] bg-[#222] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
          {resendLoading ? 'Sending...' : rateLimit > 0 ? `Resend in ${rateLimit}s` : 'Resend Code'}
        </button>
      </div>
      
      <div className="mt-6 text-[12px] text-[#888888] text-left">
        Remembered your password? <button onClick={() => router.replace('/login')} className="text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium">Login</button>
      </div>
    </div>
  );
}
""")

write_file('frontend/src/components/auth/forgot/ForgotCoordinator.tsx', """'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import ForgotRequestForm from './ForgotRequestForm';
import ForgotResetForm from './ForgotResetForm';

export default function ForgotCoordinator() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);

  useEffect(() => {
    if (rateLimit > 0) {
      const t = setTimeout(() => setRateLimit((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [rateLimit]);

  const handleRequest = async () => {
    if (!email || loading) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/forgot`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
      });
      if (res.ok) {
        showSuccess("Reset code sent! Check your email.");
        setRateLimit(60);
        setStep("verify");
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to send reset code");
      }
    } catch (_e) {
      showError("Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (loading) return;
    if (code.length !== 8) { showError("Enter the 8-digit code"); return; }
    if (!password || password.length < 12) { showError("Password must be at least 12 characters"); return; }
    if (password !== confirm) { showError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/reset`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, newPassword: password })
      });
      if (res.ok) {
        showSuccess('Password updated successfully!');
        setTimeout(() => router.replace('/login'), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to reset password");
      }
    } catch (_e) {
      showError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendLoading || rateLimit > 0 || !email) return;
    setResendLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/forgot`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
      });
      if (res.ok) {
        setRateLimit(60);
        showSuccess("Reset code re-sent! Check your email.");
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to resend code");
      }
    } catch (_e) {
      showError("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  if (step === 'request') {
    return <ForgotRequestForm email={email} setEmail={setEmail} onRequest={handleRequest} loading={loading} />;
  }

  return (
    <ForgotResetForm
      email={email} setEmail={setEmail}
      code={code} setCode={setCode}
      password={password} setPassword={setPassword}
      confirm={confirm} setConfirm={setConfirm}
      onReset={handleReset} onResend={resendCode}
      loading={loading} resendLoading={resendLoading} rateLimit={rateLimit}
    />
  );
}
""")
