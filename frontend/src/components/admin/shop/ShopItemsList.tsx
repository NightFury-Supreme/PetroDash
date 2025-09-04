"use client";

import { ShopItem } from '@/hooks/admin/shop/useAdminShop';

interface ShopItemsListProps {
  items: ShopItem[];
  onStartEditing: (item: ShopItem) => void;
  onToggleEnabled: (item: ShopItem) => Promise<void>;
}

export function ShopItemsList({
  items,
  onStartEditing,
  onToggleEnabled,
}: ShopItemsListProps) {
  const getIconForItem = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('disk')) return 'fas fa-hdd';
    if (k.includes('memory') || k.includes('ram')) return 'fas fa-memory';
    if (k.includes('cpu')) return 'fas fa-microchip';
    if (k.includes('backup')) return 'fas fa-archive';
    if (k.includes('database')) return 'fas fa-database';
    if (k.includes('alloc')) return 'fas fa-plug';
    if (k.includes('slot') || k.includes('server')) return 'fas fa-server';
    return 'fas fa-cubes';
  };

  const formatUnit = (unit?: string) => {
    if (!unit) return '';
    if (unit === 'MB') return 'MB';
    if (unit === '%') return '%';
    if (unit === 'count') return '';
    return unit;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-[#202020] rounded-full flex items-center justify-center shadow-lg">
          <i className="fas fa-shopping-cart text-white text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold mb-3 text-white">No shop items yet</h3>
        <p className="text-[#AAAAAA] text-lg mb-8">Shop items will be automatically created as presets</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div 
          key={item._id} 
          className="bg-[#181818] border border-[#303030] rounded-xl p-5 hover:bg-[#202020] transition-colors group"
        >
          {/* Item Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#202020] rounded-lg flex items-center justify-center group-hover:bg-[#272727] transition-colors">
              <i className={`${getIconForItem(item.key)} text-white text-sm`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{item.name}</h3>
              <p className="text-[#AAAAAA] text-xs truncate">{item.key}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              item.enabled 
                ? 'bg-[#202020] text-white border border-[#303030]' 
                : 'bg-[#202020] text-[#AAAAAA] border border-[#303030]'
            }`}>
              <i className={`fas ${item.enabled ? 'fa-check-circle' : 'fa-ban'} mr-2 text-white`}></i>
              {item.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          {/* Item Description */}
          {item.description && (
            <p className="text-[#AAAAAA] mb-4 text-sm leading-relaxed line-clamp-2">{item.description}</p>
          )}

          {/* Item Stats - Clean 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-[#202020] rounded-lg">
              <div className="text-lg font-bold text-white mb-1">{item.amountPerUnit}</div>
              <div className="text-xs text-[#AAAAAA]">Amount {formatUnit(item.unit)}</div>
            </div>
            
            <div className="text-center p-3 bg-[#202020] rounded-lg">
              <div className="text-lg font-bold text-white mb-1">{item.pricePerUnit}</div>
              <div className="text-xs text-[#AAAAAA]">Coins</div>
            </div>
            
            <div className="text-center p-3 bg-[#202020] rounded-lg">
              <div className="text-lg font-bold text-white mb-1">{item.maxPerPurchase}</div>
              <div className="text-xs text-[#AAAAAA]">Max</div>
            </div>
          </div>

          {/* Action Buttons - Enable Toggle + Edit */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onToggleEnabled(item)}
              className="w-12 h-12 bg-[#202020] text-white hover:bg-[#272727] border border-[#303030] rounded-lg transition-colors group-hover:border-[#404040] flex items-center justify-center"
              title={item.enabled ? "Disable this item" : "Enable this item"}
            >
              <i className={`fas ${item.enabled ? 'fa-eye' : 'fa-eye-slash'} text-[#AAAAAA] group-hover:text-white transition-colors`}></i>
            </button>
            <button
              onClick={() => onStartEditing(item)}
              className="w-12 h-12 bg-[#202020] text-white hover:bg-[#272727] border border-[#303030] rounded-lg transition-colors group-hover:border-[#404040] flex items-center justify-center"
              title="Edit Item"
            >
              <i className="fas fa-edit text-[#AAAAAA] group-hover:text-white transition-colors"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
