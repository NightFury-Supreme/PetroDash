'use client';
import AuthCard from '@/components/auth/layout/AuthCard';
import VerifyCoordinator from '@/components/auth/verify/VerifyCoordinator';

export default function VerifyPage() {
  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard title="Verify Email" subtitle="Secure your account">
        <VerifyCoordinator />
      </AuthCard>
    </main>
  );
}
