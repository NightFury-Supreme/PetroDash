import { AuthCard, RegisterForm } from '@/components/auth';

export default function RegisterPage() {
  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard>
        <RegisterForm />
      </AuthCard>
    </main>
  );
}
