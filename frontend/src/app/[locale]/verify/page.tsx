'use client';
import { AuthCard, VerifyCoordinator } from '@/components/auth';
import { useTranslations } from 'next-intl';

export default function VerifyPage() {
  const t = useTranslations('Auth.verify');
  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard title={t("title")} subtitle={t("subtitleCard")}>
        <VerifyCoordinator />
      </AuthCard>
    </main>
  );
}
