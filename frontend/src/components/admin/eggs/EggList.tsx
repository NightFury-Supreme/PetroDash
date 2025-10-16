"use client";

import Link from 'next/link';

export default function EggList({ eggs }: { eggs: any[] }) {
  if (eggs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-[#202020] rounded-full flex items-center justify-center">
          <i className="fas fa-egg text-white text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold mb-2">No eggs found</h3>
        <p className="text-[#AAAAAA]">Create your first egg to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {eggs.map((egg) => (
        <Link key={egg._id} href={`/admin/eggs/${egg._id}`} className="block p-5 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(egg as any).icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE}${(egg as any).icon}`}
                  alt={egg.name}
                  className="w-10 h-10 rounded-md object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <i className="fas fa-egg text-white"></i>
              )}
              <div>
                <div className="font-semibold">{egg.name}</div>
                <div className="text-sm text-[#AAAAAA]">Nest #{egg.pterodactylNestId} • Egg #{egg.pterodactylEggId} • {egg.category}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {egg.recommended && (
                <span className="px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">Recommended</span>
              )}
              <div className="text-[#AAAAAA]">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}


