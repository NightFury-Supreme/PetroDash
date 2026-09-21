import { useTranslations } from 'next-intl';

export function AdminLedgerHeader() {
  const t = useTranslations('Admin.ledger');

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
        <i className="fas fa-file-invoice-dollar text-white text-lg sm:text-2xl"></i>
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{t('headerTitle')}</h1>
        <p className="text-[#AAAAAA] text-base sm:text-lg">{t('headerSubtitle')}</p>
      </div>
    </div>
  );
}



