"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Globe, Plus } from 'lucide-react';
import LocationList from '@/components/admin/locations/LocationList';
import { CreateLocationDrawer } from '@/components/admin/locations/CreateLocationDrawer';
import { EditLocationDrawer } from '@/components/admin/locations/EditLocationDrawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import AdminLocationsSkeleton from '@/components/skeletons/admin/locations/AdminLocationsSkeleton';

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);

  const fetchLocations = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to fetch locations');
        if (Array.isArray(data)) setLocations(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const filteredLocations = locations.filter(loc => {
    if (!searchQuery.trim()) return true;
    const lower = searchQuery.toLowerCase();
    return (loc.name || '').toLowerCase().includes(lower) || (loc.latencyUrl || '').toLowerCase().includes(lower);
  });

  const handleExecuteDelete = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      let d: any = {}; try { d = await res.json(); } catch {}
      throw new Error(d?.error || 'Failed to delete location');
    }
    fetchLocations();
  };

  if (error) throw new Error(error);

  if (loading) return <AdminLocationsSkeleton />;

  const locationToDelete = locations.find(l => l._id === deletingLocationId);

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Locations</h1>
            <p className="text-[#888888] mt-1 text-sm">Monitor and manage all deployment locations.</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
          >
            <Plus size={12} /> New Location
          </button>
        </div>

        {/* Search */}
        <section className="mt-[25px]">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search by location name or node IP..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors" aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </section>

        <LocationList
          locations={filteredLocations}
          onEdit={id => setEditingLocationId(id)}
          onDelete={setDeletingLocationId}
        />
      </div>

      {isDrawerOpen && (
        <CreateLocationDrawer
          onClose={() => setIsDrawerOpen(false)}
          onSuccess={() => { setIsDrawerOpen(false); fetchLocations(); }}
        />
      )}

      {editingLocationId && (
        <EditLocationDrawer
          locationId={editingLocationId}
          onClose={() => setEditingLocationId(null)}
          onUpdate={() => { setEditingLocationId(null); fetchLocations(); }}
        />
      )}

      <DeleteDrawer
        isOpen={!!deletingLocationId}
        onClose={() => setDeletingLocationId(null)}
        onConfirm={async () => { if (deletingLocationId) await handleExecuteDelete(deletingLocationId); }}
        entityType="Location"
        entityName={locationToDelete?.name || ''}
        entitySubText={locationToDelete?.latencyUrl ? `Node IP: ` : ''}
        icon={<Globe size={24} />}
        warningPoints={[
          'Location configuration will be permanently deleted.',
          'Existing servers in this location will lose their location reference.',
          'This action cannot be undone.',
        ]}
      />
    </div>
  );
}
