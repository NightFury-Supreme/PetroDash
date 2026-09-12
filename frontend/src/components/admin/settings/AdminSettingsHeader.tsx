export function AdminSettingsHeader() {
  return (
    <header>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">System Settings</h1>
          <p className="text-[#888888] mt-1 text-sm">Configure brand, resources, authentication, and payments.</p>
        </div>
      </div>
    </header>
  );
}



