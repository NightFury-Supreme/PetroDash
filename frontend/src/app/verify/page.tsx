"use client";

import AuthCard from "@/components/auth/AuthCard";
import VerifyCard from "@/components/verify/VerifyCard";

export default function VerifyPage() {
  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard title="Verify Email" subtitle="Secure your account">
        <VerifyCard />
      </AuthCard>
    </main>
  );
}