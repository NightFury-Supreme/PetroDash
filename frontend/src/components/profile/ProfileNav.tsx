import React from "react";
import { useTranslations } from "next-intl";
import { User, ShieldCheck, Monitor, Activity, CreditCard, Trash2 } from "lucide-react";
import { SideItem } from "./ui/SideItem";

export type ProfileSection = "overview" | "security" | "sessions" | "activity" | "invoices";

interface ProfileNavProps {
  section: ProfileSection;
  setSection: (s: ProfileSection) => void;
  onOpenDelete: () => void;
}

export function ProfileNav({ section, setSection, onOpenDelete }: ProfileNavProps) {
  const t = useTranslations("Profile");

  return (
    <aside className="w-full lg:w-48 shrink-0 pt-1">
      <div className="sticky top-6">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">{t('account')}</p>
        </div>
        <nav className="space-y-1">
          <SideItem 
            icon={User} 
            label={t('overview')} 
            active={section === "overview"} 
            onClick={() => setSection("overview")} 
          />
          <SideItem 
            icon={ShieldCheck} 
            label={t('security')} 
            active={section === "security"} 
            onClick={() => setSection("security")} 
          />
          <SideItem 
            icon={Monitor} 
            label={t('activeSessions')} 
            active={section === "sessions"} 
            onClick={() => setSection("sessions")} 
          />
          <SideItem 
            icon={Activity} 
            label={t('activityLog')} 
            active={section === "activity"} 
            onClick={() => setSection("activity")} 
          />
          <SideItem 
            icon={CreditCard} 
            label={t('invoices')} 
            active={section === "invoices"} 
            onClick={() => setSection("invoices")} 
          />
        </nav>
        
        <div className="mt-8 border-t border-[#333] pt-6 mb-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">{t('accountActions')}</p>
        </div>
        <nav className="space-y-1">
          <SideItem 
            icon={Trash2} 
            label={t('deleteAccount')} 
            danger 
            active={false} 
            onClick={onOpenDelete} 
          />
        </nav>
      </div>
    </aside>
  );
}
