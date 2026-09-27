'use client';
import { AuthCard, ForgotCoordinator } from '@/components/auth';

export default function ForgotPage() {
  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard>
        <ForgotCoordinator />
      </AuthCard>
    </main>
  );
}
