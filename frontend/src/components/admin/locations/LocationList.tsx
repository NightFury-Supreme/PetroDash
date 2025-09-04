"use client";

import Link from 'next/link';

export default function LocationList({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)' }}>
          <i className="fas fa-location-dot text-white text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold mb-2">No locations found</h3>
        <p className="text-[#AAAAAA]">Create your first location to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((location) => (
        <Link key={location._id} href={`/admin/locations/${location._id}`} className="block p-5 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {location.flagUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={location.flagUrl} alt={location.name} className="w-8 h-8 rounded object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <i className="fas fa-location-dot text-white"></i>
              )}
              <div>
                <div className="font-semibold">{location.name}</div>
                <div className="text-sm text-[#AAAAAA]">Servers limit: {location.serverLimit} • Latency URL: {location.latencyUrl || 'N/A'}</div>
              </div>
            </div>
            <div className="text-[#AAAAAA]">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}


