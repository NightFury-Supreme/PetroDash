'use client';
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
        <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000000" maxLength={8} className="w-full h-[42px] px-[13px] text-center font-mono tracking-widest bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" style={{ letterSpacing: '0.5em' }} />
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
