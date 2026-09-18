"use client";

export default function EmailHeader({ onSave, saving }: { onSave: ()=>void; saving: boolean; }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-white text-xl font-semibold">Email Settings</h2>
      <div className="flex gap-3">
        <button disabled={saving} onClick={onSave} className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
}




