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
  const wallpaperUrl = "https://r4.wallpaperflare.com/wallpaper/948/782/354/minecraft-minecraft-dungeons-ocean-view-minecraft-dungeons-hidden-depths-4k-hd-wallpaper-d8565d58c0f08c58c04c118e68f2d44a.jpg";

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#0F0F0F] text-white font-sans overflow-hidden">
      
      {/* Left Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-20 xl:p-24 overflow-y-auto z-10 custom-scrollbar">
        <div className="w-full max-w-sm mx-auto my-auto py-8">
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

      {/* Right Side: 4K Wallpaper (Full Bleed) */}
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
      
    </div>
  );
}
