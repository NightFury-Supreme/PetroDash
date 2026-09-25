"use client";

import React, { useEffect } from 'react';

const dict: Record<string, any> = {
  en: { kicker: "Critical Error", title: "Application Error", defaultMsg: "We encountered a critical unexpected issue while loading this page. Please reload the application.", reload: "Reload Application" },
  hi: { kicker: "गंभीर त्रुटि", title: "एप्लिकेशन त्रुटि", defaultMsg: "इस पृष्ठ को लोड करते समय हमें एक अप्रत्याशित समस्या का सामना करना पड़ा। कृपया एप्लिकेशन पुनः लोड करें।", reload: "एप्लिकेशन पुनः लोड करें" },
  es: { kicker: "Error Crítico", title: "Error de Aplicación", defaultMsg: "Encontramos un problema inesperado crítico al cargar esta página. Por favor recarga la aplicación.", reload: "Recargar Aplicación" },
  fr: { kicker: "Erreur Critique", title: "Erreur d'Application", defaultMsg: "Nous avons rencontré un problème critique inattendu lors du chargement de cette page. Veuillez recharger l'application.", reload: "Recharger l'Application" },
  de: { kicker: "Kritischer Fehler", title: "Anwendungsfehler", defaultMsg: "Beim Laden dieser Seite ist ein kritisches unerwartetes Problem aufgetreten. Bitte laden Sie die Anwendung neu.", reload: "Anwendung neu laden" },
  ar: { kicker: "خطأ فادح", title: "خطأ في التطبيق", defaultMsg: "واجهنا مشكلة غير متوقعة أثناء تحميل هذه الصفحة. يرجى إعادة تحميل التطبيق.", reload: "إعادة تحميل التطبيق" }
};

export default function GlobalError({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled root layout error:', error);
  }, [error]);

  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'en';
  const t = dict[locale] || dict.en;

  const msg = error.message && error.message !== 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.' ? error.message : t.defaultMsg;

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale || "en"} dir={dir}>
      <body>
        <div className="flex flex-col items-center justify-center w-full flex-1 bg-[#0F0F0F] min-h-screen text-sans">
          <section className="text-center w-full max-w-[620px] px-4" aria-labelledby="error-title">
            <div className="mx-auto mb-[24px] flex items-center justify-center text-[#FF5722]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]">
                <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>
                <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/>
                <path d="M6 6h.01"/>
                <path d="M6 18h.01"/>
                <path d="m13 6-4 6h6l-4 6"/>
              </svg>
            </div>
            <p className="m-0 mb-2.5 text-[#FF5722] text-[10px] font-semibold tracking-[0.12em] uppercase">
              {t.kicker}
            </p>
            <h1 id="error-title" className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em]">
              {t.title}
            </h1>
            <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
              {msg}
            </p>
            <div className="mt-[29px] flex justify-center gap-3">
              <button 
                type="button" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[14px] h-[14px]">
                  <path d="M20 11a8 8 0 0 0-14.7-4M4 5v4h4M4 13a8 8 0 0 0 14.7 4M20 19v-4h-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                {t.reload}
              </button>
            </div>
          </section>
        </div>
      </body>
    </html>
  );
}
