"use client";

type EmailBrand = { name?: string; logoUrl?: string; footerText?: string; brandColor?: string };

export default function BrandingForm({ brand, onChange }:{ brand: EmailBrand; onChange: (path: string, value: any)=>void; }) {
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="input" placeholder="Brand name" value={brand?.name || ''} onChange={e => onChange('emailBrand.name', e.target.value)} />
        <input className="input" placeholder="Logo URL" value={brand?.logoUrl || ''} onChange={e => onChange('emailBrand.logoUrl', e.target.value)} />
        <input className="input" placeholder="Brand color (hex)" value={brand?.brandColor || '#0ea5e9'} onChange={e => onChange('emailBrand.brandColor', e.target.value)} />
        <input className="input" placeholder="Footer text" value={brand?.footerText || ''} onChange={e => onChange('emailBrand.footerText', e.target.value)} />
      </div>
    </div>
  );
}






