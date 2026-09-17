"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';

export default function ForgotCard() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        showSuccess("Reset code sent! Check your email.");
        setRateLimit(60);
        setStep("verify");
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to send reset code");
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password })
      });
      if (res.ok) {
        showSuccess('Password updated successfully!');
        setTimeout(() => router.replace('/login'), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to reset password");
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setRateLimit(60);
        showSuccess("Reset code re-sent! Check your email.");
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to resend code");
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_e) {
      showError("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCode(value);
      };

  

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-left">
        <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full h-[42px] px-[13px] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
      </div>
      {step === 'verify' && (
        <>
          <div className="space-y-2 text-left">
            <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">Verification Code</label>
            <input type="text" value={code} onChange={handleCodeChange} placeholder="00000000" maxLength={8} className="w-full h-[42px] px-[13px] text-center font-mono tracking-widest bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" style={{ letterSpacing: '0.5em' }} />
          </div>
          <div className="space-y-2 text-left">
            <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 12 characters" className="w-full h-[42px] px-[13px] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
          </div>
          <div className="space-y-2 text-left">
            <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className="w-full h-[42px] px-[13px] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
          </div>
        </>
      )}
      <div className="space-y-3 pt-2">
        {step === 'request' ? (
          <button onClick={handleRequest} disabled={loading || !email} className="w-full h-[42px] bg-[#FF5722] hover:bg-[#F4511E] disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Reset Code</>}
          </button>
        ) : (
          <>
            <button onClick={handleReset} disabled={loading || code.length !== 8 || !password || password !== confirm} className="w-full h-[42px] bg-[#FF5722] hover:bg-[#F4511E] disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : <><i className="fas fa-check"></i> Reset Password</>}
            </button>
            <button onClick={resendCode} disabled={resendLoading || rateLimit > 0} className="w-full h-[42px] bg-[#222] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
              {resendLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : rateLimit > 0 ? <><i className="fas fa-clock"></i> Resend in {rateLimit}s</> : <><i className="fas fa-paper-plane"></i> Resend Code</>}
            </button>
          </>
        )}
      </div>
      <div className="mt-6 text-[12px] text-[#888888] text-left">
        Remembered your password? <button onClick={() => router.replace('/login')} className="text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium">Login</button>
      </div>
    </div>
  );
}
