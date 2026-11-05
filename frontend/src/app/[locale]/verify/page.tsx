import { AuthCard, VerifyCoordinator } from '@/components/auth';

export default function VerifyPage() {
  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard>
        <VerifyCoordinator />
      </AuthCard>
    </main>
  );
}
