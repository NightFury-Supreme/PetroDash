"use client";

import VerifyCard from "@/components/verify/VerifyCard";

export default function VerifyPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <VerifyCard />
    </div>
  );
}