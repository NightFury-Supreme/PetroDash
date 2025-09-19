"use client";

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
      const res = await fetch(`${base}/api/auth/forgot`, {
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
      const res = await fetch(`${base}/api/auth/reset`, {
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
      const res = await fetch(`${base}/api/auth/forgot`, {
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
      <div className="w-full max-w-md mx-auto rounded-2xl p-8 text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <AuthHeader iconClass="fas fa-check" iconBg="bg-[#0d3a0d]" title="Password Reset" />
        <p className="text-[#AAAAAA] text-lg">Your password has been updated successfully.</p>
        <div className="mt-8">
          <button onClick={() => router.replace('/login')} className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 rounded-xl transition-colors">
            <span className="flex items-center justify-center gap-2"><i className="fas fa-arrow-right text-black"></i>Go to Login</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl p-8 text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <AuthHeader iconClass="fas fa-key" iconBg="bg-[#0d3a3a]" title="Forgot Password" />
      <p className="text-[#AAAAAA] mb-6">{step === 'request' ? 'Enter your account email to receive a reset code.' : 'Enter the 8-digit code and your new password.'}</p>
      <div className="space-y-4">
        <div className="space-y-2 text-left">
          <label className="block text-sm font-medium text-white">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 bg-[#202020] border border-[#303030] rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        {step === 'verify' && (
          <>
            <div className="space-y-2 text-left">
              <label className="block text-sm font-medium text-white">Verification Code</label>
              <input type="text" value={code} onChange={handleCodeChange} placeholder="00000000" maxLength={8} className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-[#202020] border border-[#303030] rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-blue-500 transition-colors" style={{ letterSpacing: '0.5em' }} />
            </div>
            <div className="space-y-2 text-left">
              <label className="block text-sm font-medium text-white">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 12 characters with letters, numbers, and symbols" className="w-full px-4 py-3 bg-[#202020] border border-[#303030] rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div className="space-y-2 text-left">
              <label className="block text-sm font-medium text-white">Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className="w-full px-4 py-3 bg-[#202020] border border-[#303030] rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30 text-green-400 text-sm">{success}</div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}
        <div className="space-y-3">
          {step === 'request' ? (
            <button onClick={handleRequest} disabled={loading || !email} className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-xl transition-colors">
              {loading ? (<span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin text-black"></i>Sending...</span>) : (<span className="flex items-center justify-center gap-2"><i className="fas fa-paper-plane text-black"></i>Send Reset Code</span>)}
            </button>
          ) : (
            <>
              <button onClick={handleReset} disabled={loading || code.length !== 8 || !password || password !== confirm} className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-xl transition-colors">
                {loading ? (<span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin text-black"></i>Updating...</span>) : (<span className="flex items-center justify-center gap-2"><i className="fas fa-check text-black"></i>Reset Password</span>)}
              </button>
              <button onClick={resendCode} disabled={resendLoading || rateLimit > 0} className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-xl transition-colors">
                {resendLoading ? (<span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin text-black"></i>Sending...</span>) : rateLimit > 0 ? (<span className="flex items-center justify-center gap-2"><i className="fas fa-clock text-black"></i>Resend in {rateLimit}s</span>) : (<span className="flex items-center justify-center gap-2"><i className="fas fa-paper-plane text-black"></i>Resend Code</span>)}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="mt-6 text-xs text-[#888]">Remembered your password? <button onClick={() => router.replace('/login')} className="underline">Go to login</button></div>
    </div>
  );
}