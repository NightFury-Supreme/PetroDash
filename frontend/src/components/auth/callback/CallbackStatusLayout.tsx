import React from 'react';
import { AuthSpinner } from '@/components/auth/layout/AuthSpinner';

export interface CallbackStatusLayoutProps {
  title?: string;
  description?: string;
}

export function CallbackStatusLayout({
  title,
  description,
}: CallbackStatusLayoutProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F0F0F] px-4"
      role="status"
    >
      <AuthSpinner className="h-10 w-10 shrink-0" />
      {title && (
        <h1 className="mt-6 text-[#ededed] text-[clamp(20px,2.5vw,26px)] leading-[1.25] font-semibold tracking-[-0.03em] text-center">
          {title}
        </h1>
      )}
      {description && (
        <p className="mt-2 text-[#888888] text-[13px] leading-[1.6] text-center max-w-[420px]">
          {description}
        </p>
      )}
    </div>
  );
}

export default CallbackStatusLayout;
