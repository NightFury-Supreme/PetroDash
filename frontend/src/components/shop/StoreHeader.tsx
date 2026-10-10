"use client";


interface StoreHeaderProps {
  activeTab: "items" | "plans";
  coins: number | null;
  onTabChange: (tab: "items" | "plans") => void;
}

export function StoreHeader({ activeTab: _activeTab, coins: _coins, onTabChange: _onTabChange }: StoreHeaderProps) {
  return (
    <>


      <header className="flex items-start justify-between">
      {/* Left: title + tabs */}
      <div>
        <div>
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Store</h1>
          <p className="text-[#888888] mt-1 text-sm">Purchase resources and premium plans.</p>
        </div>

      </div>
      </header>
    </>
  );
}
