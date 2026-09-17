"use client";

import AuthCard from "@/components/auth/AuthCard";
import ForgotCard from "@/components/forgot/ForgotCard";

export default function ForgotPage() {
  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard title="Reset Password" subtitle="Enter your email to receive a reset link">
        <ForgotCard />
      </AuthCard>
    </main>
  );
}


