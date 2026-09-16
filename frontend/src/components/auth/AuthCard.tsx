"use client";

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  siteName?: string;
  siteIcon?: string;
}

export default function AuthCard({ title, subtitle, children, siteName = 'PteroDash', siteIcon = '' }: AuthCardProps) {
  const iconSrc = siteIcon ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${siteIcon}` : '/logo.svg';
  
  // Stunning abstract dark 4K wallpaper as placeholder
  const wallpaperUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

  return (
    <section className="min-h-screen flex bg-[#0F0F0F] text-white font-sans">
      
      {/* Left Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md rounded-2xl p-8 bg-[#121212] border border-[#282828] shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-[#1A1A1A] border border-[#333]">
              <img src={iconSrc} alt={siteName} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{siteName}</h1>
          </div>
          <h2 className="text-2xl font-bold mb-1.5 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[13px] text-[#888888] mb-8">{subtitle}</p>}
          {children}
        </div>
      </div>

      {/* Right Side: 4K Wallpaper */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#050505]">
        <img 
          src={wallpaperUrl} 
          alt="Dashboard Wallpaper" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        {/* Subtle overlay gradient to blend nicely with the dark theme */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-transparent to-transparent opacity-80 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent opacity-40 pointer-events-none"></div>
      </div>
      
    </section>
  );
}
