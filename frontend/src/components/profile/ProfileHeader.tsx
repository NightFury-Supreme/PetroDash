import React from "react";
import { useTranslations } from "next-intl";
import { Check, Coins } from "lucide-react";

interface ProfileHeaderProps {
  form: {
    profilePicture?: string;
    username: string;
    firstName?: string;
    lastName?: string;
    emailVerification?: boolean;
    emailVerified?: boolean;
    coins?: number;
  };
}

export function ProfileHeader({ form }: ProfileHeaderProps) {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");

  return (
    <section className="border-b border-white/[0.06] pb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-[#2A2A2A] bg-[#222]">
              {form.profilePicture ? (
                <img src={form.profilePicture} alt={form.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-2xl text-[#D4D4D4]">
                  {(form.firstName || form.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {form.emailVerification && form.emailVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#161616] bg-emerald-500">
                <Check size={11} strokeWidth={3} className="text-white" />
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[#D4D4D4]">
                {`${form.firstName || ''} ${form.lastName || ''}`.trim() || form.username || tCommon('user')}
              </h2>
            </div>
            <p className="mt-1 text-sm text-[#888]">
              @{form.username || tCommon('user')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <Coins size={16} className="text-[#FF5722]" />
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-[#666]">{t('balance')}</span>
              <span className="text-sm font-medium text-[#D4D4D4]">{form.coins || 0} {t('coins')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
