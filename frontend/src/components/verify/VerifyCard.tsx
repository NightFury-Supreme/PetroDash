"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from '@/components/ui/ToastProvider';

export default function VerifyCard() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [rateLimit, setRateLimit] = useState<number>(0);
  
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [changeMode, setChangeMode] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tfaCode, setTfaCode] = useState("");

  useEffect(() => {
    try { setEmail(sessionStorage.getItem("verify_email") || ""); } catch {}
    let active = true;
    const check = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) { if (active) router.replace("/login"); return; }
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const [res, brandingRes] = await Promise.all([
          fetchWithRetry(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
          fetchWithRetry(`${base}/api/branding`, { cache: "no-store" })
        ]);
        if (res.ok) {
          let data: any = {}; try { data = await res.json(); } catch {}
          let brandingData: any = {}; try { brandingData = await brandingRes.json(); } catch {}
          setTfaEnabled(Boolean(data.tfaEnabled));
          setLoginMethod(data.loginMethod || "email");
          if (!changeMode && data.email) {
            setEmail(data.email);
          }
          if (data.emailVerified || brandingData.emailVerification === false) {
            if (!active) return;
            try { sessionStorage.removeItem("verify_email"); } catch {}
            router.replace("/dashboard");
          }
        } else if (res.status === 401) {
          if (active) router.replace("/login");
        }
      } catch {
        if (active) router.replace("/login");
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { active = false; clearInterval(id); };
  }, [router]);

  useEffect(() => {
    if (rateLimit > 0) {
      const timer = setTimeout(() => setRateLimit(rateLimit - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimit]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCode(value);
    
  };

  const verifyCode = async () => {
    if (code.length !== 8) { showError('Please enter an 8-digit verification code'); return; }
    setLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/verify/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, code })
      });
      if (res.ok) {
        try { sessionStorage.removeItem("verify_email"); } catch {}
        showSuccess('Email verified successfully');
        setTimeout(() => router.replace('/dashboard'), 1500);
        
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || 'Invalid verification code');
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_e) {
      showError('Failed to verify code. Please try again.');
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
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setRateLimit(60);
        setCodeSent(true);
        showSuccess('Verification code sent! Check your email.');
        
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
    // eslint-disable-next-line unused-imports/no-unused-vars
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
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
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

  if (changeMode) {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-[#888888] mb-6 text-center">Update your account email address.</p>
          
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">New Email Address</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" className="w-full h-[42px] px-[13px] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
            </div>
            
            {loginMethod === 'email' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">Current Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-[42px] px-[13px] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
              </div>
            )}
            
            {tfaEnabled && (
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">2FA Code</label>
                <input type="text" maxLength={6} value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full h-[42px] px-[13px] text-center font-mono tracking-[0.2em] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
              </div>
            )}

            
            
            <div className="space-y-3 mt-6">
              <button onClick={handleChangeEmail} disabled={loading} className="w-full h-[42px] bg-[#FF5722] hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : <><i className="fas fa-save"></i> Change Email</>}
              </button>
              <button onClick={() => { setChangeMode(false);  }} disabled={loading} className="w-full h-[42px] bg-[#222] hover:bg-[#333] disabled:opacity-50 text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#888888] mb-6 text-center">{codeSent ? 'Enter the 8-digit verification code sent to your email address.' : 'Click the button below to send a verification code to your email address.'}</p>
      
      <div className="flex items-center justify-between bg-[#121212] border border-[#282828] rounded-[7px] p-3">
        <div className="text-left truncate pr-2">
          <span className="text-[#888888] block text-[10px] uppercase tracking-wider mb-0.5 font-medium">Email</span>
          <span className="font-medium text-[#d5d5d5] text-[13px]">{email}</span>
        </div>
        <button onClick={() => { setChangeMode(true); setNewEmail(email);  }} className="shrink-0 px-3 h-[28px] bg-[#222] hover:bg-[#333] border border-[#333] rounded-[5px] text-[11px] font-medium text-[#aaa] hover:text-white transition-colors">
          Edit
        </button>
      </div>

      {codeSent && (
        <div className="space-y-2 pt-2 text-left">
          <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">Verification Code</label>
          <input type="text" value={code} onChange={handleCodeChange} placeholder="00000000" maxLength={8} className="w-full h-[42px] px-[13px] text-center font-mono tracking-[0.2em] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
        </div>
      )}

      
      

      <div className="space-y-3 pt-2">
        {codeSent && (
          <button onClick={verifyCode} disabled={loading || code.length !== 8} className="w-full h-[42px] bg-[#FF5722] hover:bg-[#F4511E] disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : <><i className="fas fa-check"></i> Verify Email</>}
          </button>
        )}
        <button onClick={resendCode} disabled={resendLoading || rateLimit > 0} className={`w-full h-[42px] font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2 ${codeSent ? 'bg-[#222] hover:bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed'}`}>
          {resendLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : rateLimit > 0 ? <><i className="fas fa-clock"></i> Resend in {Math.floor(rateLimit / 60) > 0 ? `${Math.floor(rateLimit / 60)}m ` : ''}{rateLimit % 60}s</> : <><i className="fas fa-paper-plane"></i> {codeSent ? 'Resend Code' : 'Send Verification Code'}</>}
        </button>
      </div>

      <div className="mt-6 text-[11px] text-[#888888] text-center">
        Check your email inbox and spam folder for the verification code. The code expires in 15 minutes.
      </div>
    </div>
  );
}