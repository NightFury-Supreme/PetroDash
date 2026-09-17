'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import TwoFactorForm from './TwoFactorForm';

export default function LoginCoordinator() {
  const router = useRouter();
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const handleSuccess = (token: string) => {
    localStorage.setItem('auth_token', token);
    router.push('/dashboard');
  };

  const handleRequires2FA = (token: string) => {
    setTempToken(token);
    setRequires2FA(true);
  };

  const handleCancel2FA = () => {
    setTempToken(null);
    setRequires2FA(false);
  };

  if (requires2FA && tempToken) {
    return <TwoFactorForm tempToken={tempToken} onSuccess={handleSuccess} onCancel={handleCancel2FA} />;
  }

  return <LoginForm onSuccess={handleSuccess} onRequires2FA={handleRequires2FA} />;
}
