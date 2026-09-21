"use client";

import { useEffect, useState } from 'react';
import { Search, X, Globe, Plus, MapPin, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import LocationList from '@/components/admin/locations/LocationList';
import { CreateLocationDrawer } from '@/components/admin/locations/CreateLocationDrawer';
import { EditLocationDrawer } from '@/components/admin/locations/EditLocationDrawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import AdminLocationsSkeleton from '@/components/skeletons/admin/locations/AdminLocationsSkeleton';
import { useAdminLocations } from '@/hooks/admin/locations/useAdminLocations';
import { useTranslations } from 'next-intl';

export default function LocationsPage() {
  const t = useTranslations('admin.locations');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const { locations, loading, error, fetchLocations, deleteLocation } = useAdminLocations();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const filteredLocations = locations.filter(loc => {
    if (!searchQuery.trim()) return true;
    const lower = searchQuery.toLowerCase();
    return (loc.name || '').toLowerCase().includes(lower) || (loc.latencyUrl || '').toLowerCase().includes(lower);
  });

  const handleExecuteDelete = async (id: string) => {
    await deleteLocation(id);
  };

  if (error) {
    const displayError = tErrorBackend.has(error) ? tErrorBackend(error) : error;
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<MapPin strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={tCommon('error.kicker')}
          title={t('error.title')}
          errorString={displayError}
          description={<ErrorDescription error={displayError} topic={tCommon('locations')} />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('actions.retry')}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  if (loading) return <AdminLocationsSkeleton />;

  const locationToDelete = locations.find(l => l._id === deletingLocationId);

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('title')}</h1>
            <p className="text-[#888888] mt-1 text-sm">{t('description')}</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
          >
            <Plus size={12} /> {t('actions.newLocation')}
          </button>
        </div>

        {/* Search */}
        <section className="mt-[25px]">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
              <Search size={15} />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors" aria-label={tCommon('actions.clear')}>
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
        entityType={tCommon('location')}
        entityName={locationToDelete?.name || ''}
        entitySubText={locationToDelete?.latencyUrl ? `${t('table.nodeIp')}: ` : ''}
        icon={<Globe size={24} />}
        warningPoints={[
          t('delete.warning1'),
          t('delete.warning2'),
          t('delete.warning3'),
        ]}
      />
    </div>
  );
}
