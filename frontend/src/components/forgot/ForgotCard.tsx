"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/auth/AuthHeader";

export default function ForgotCard() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (rateLimit > 0) {
      const t = setTimeout(() => setRateLimit((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [rateLimit]);

  const handleRequest = async () => {
    if (!email || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setSuccess("Reset code sent! Check your email.");
        setRateLimit(60);
        setStep("verify");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to send reset code");
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_e) {
      setError("Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (loading) return;
    if (code.length !== 8) { setError("Enter the 8-digit code"); return; }
    if (!password || password.length < 12) { setError("Password must be at least 12 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password })
      });
      if (res.ok) {
        setStep("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to reset password");
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_e) {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendLoading || rateLimit > 0 || !email) return;
    setResendLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setRateLimit(60);
        setSuccess("Reset code re-sent! Check your email.");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to resend code");
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_e) {
      setError("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCode(value);
    setError(null);
  };

  if (step === "success") {
    return (
      <div className="space-y-6 text-center">
        <p className="text-[#AAAAAA] text-[14px]">Your password has been updated successfully.</p>
        <button onClick={() => router.replace('/login')} className="w-full h-[42px] bg-[#FF5722] hover:bg-[#F4511E] text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
          <i className="fas fa-arrow-right"></i> Go to Login
        </button>
      </div>
    );
  }

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
      {success && (
        <div className="p-3 rounded-[7px] bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 text-[13px]">{success}</div>
      )}
      {error && (
        <div className="p-3 rounded-[7px] bg-red-900/20 border border-red-500/30 text-red-400 text-[13px]">{error}</div>
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