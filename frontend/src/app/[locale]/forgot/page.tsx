'use client';
import AuthCard from '@/components/auth/layout/AuthCard';
import ForgotCoordinator from '@/components/auth/forgot/ForgotCoordinator';

export default function ForgotPage() {
  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard>
        <ForgotCoordinator />
      </AuthCard>
    </main>
  );
}
