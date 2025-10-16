"use client";

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  siteName?: string;
  siteIcon?: string;
}

export default function AuthCard({ title, subtitle, children, siteName = 'PteroDash', siteIcon = '' }: AuthCardProps) {
  const iconSrc = siteIcon ? `${process.env.NEXT_PUBLIC_API_BASE}${siteIcon}` : '/logo.svg';
  return (
    <section className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 icon-gradient rounded-xl flex items-center justify-center shadow-glow overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc} alt={siteName} className="w-10 h-10 object-cover rounded-xl" />
          </div>
          <h1 className="text-xl font-bold">{siteName}</h1>
        </div>
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-muted mb-6">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
