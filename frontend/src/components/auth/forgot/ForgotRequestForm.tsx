'use client';
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
