"use client";

import { AdminSettingsHeader, AdminSettingsContent } from '@/components/admin/settings';

export default function AdminSettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <AdminSettingsHeader />
      <AdminSettingsContent />
    </div>
  );
}
