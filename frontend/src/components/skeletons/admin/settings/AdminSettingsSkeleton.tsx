import { Palette, Globe, ShieldCheck, Server, Users, RefreshCw, Mail, LayoutTemplate, Image as ImageIcon } from 'lucide-react';

const PayPalIcon = ({ size }: { size?: number }) => <i className="fab fa-paypal" style={{ fontSize: size, width: size, textAlign: 'center' }}></i>;
const GoogleIcon = ({ size }: { size?: number }) => <i className="fab fa-google" style={{ fontSize: size, width: size, textAlign: 'center' }}></i>;

function SideItem({ icon: Icon, label, active }: { icon: any; label: string; active?: boolean; }) {
  return (
    <div
      className={`
        group
        relative
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-2.5
        py-2
        text-left
        text-sm
        transition-colors
        ${active ? "bg-white/10 text-white" : "text-zinc-500"}
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </div>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Static Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">System Settings</h1>
        <p className="text-sm text-[#888888]">
          Configure your PteroDash installation
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Static Sidebar */}
        <aside className="w-full lg:w-48 shrink-0 pt-1">
          <div className="sticky top-6">
            <div className="mb-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Settings</p>
            </div>
            <nav className="flex flex-col gap-1">
              <SideItem icon={Palette} label="Brand" active={true} />
              <SideItem icon={Globe} label="Localization" />
              <SideItem icon={ShieldCheck} label="Authentication" />
              <SideItem icon={Mail} label="Email" />
              <SideItem icon={Server} label="Default Resources" />
              <SideItem icon={Users} label="Referrals" />
              <SideItem icon={GoogleIcon} label="Google AdSense" />
              <SideItem icon={PayPalIcon} label="PayPal" />
              <SideItem icon={RefreshCw} label="System Updates" />
            </nav>
          </div>
        </aside>

        {/* Content Area Skeleton */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          <div className="space-y-6 animate-in fade-in duration-200">
            <section>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">Brand Settings</h3>
                  <p className="mt-2 text-sm text-white/35">Customize your site appearance</p>
                </div>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {[
                  { icon: <LayoutTemplate size={16} />, title: "Site Name", desc: "The global name of your application." },
                  { icon: <ImageIcon size={16} />, title: "Site Icon", desc: "Upload an image (max 5MB, PNG/JPG/GIF/WEBP/SVG)." }
                ].map((row, i) => (
                  <div key={i} className="px-5 py-4 transition hover:bg-white/[0.02]">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr] md:items-start">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
                          {row.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#D4D4D4]">{row.title}</p>
                          <div className="mt-0.5 text-[13px] text-[#888]">{row.desc}</div>
                        </div>
                      </div>
                      <div className="flex flex-col w-full justify-center md:items-end">
                        <div className="text-sm text-[#D4D4D4] flex items-center md:justify-end h-9 w-full md:w-32">
                          <div className="h-5 w-full bg-white/[0.04] rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
