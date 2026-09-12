import re
import os

filepath = 'frontend/src/components/admin/settings/AdminSettingsContent.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

settings_row_old = """function SettingsRow({ label, description, children, vertical = false }: { label: string, description: React.ReactNode, children: React.ReactNode, vertical?: boolean }) {
  return (
    <div className="px-5 py-5 transition hover:bg-white/[0.02]">
      <div className={`grid grid-cols-1 ${vertical ? 'gap-3' : 'gap-4 md:grid-cols-[250px_1fr] md:items-center'}`}>
        <div>
          <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
          <div className="mt-0.5 text-[13px] text-[#888]">{description}</div>
        </div>
        <div className="flex flex-col w-full justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}"""

settings_row_new = """function SettingsRow({ label, description, children, vertical = false, displayValue, onSave }: { label: string, description: React.ReactNode, children: React.ReactNode, vertical?: boolean, displayValue?: React.ReactNode, onSave?: () => Promise<void> | void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      await onSave();
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-start`}>
        <div className="md:mt-1">
          <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
          <div className="mt-0.5 text-[13px] text-[#888]">{description}</div>
        </div>
        <div className="flex flex-col w-full justify-center">
          {isEditing ? children : (displayValue !== undefined ? <div className="text-sm text-white/70 mt-1">{displayValue}</div> : children)}
        </div>
        <div className="flex items-center justify-end gap-2">
          {displayValue !== undefined && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex h-8 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 text-xs font-medium text-white transition-colors hover:bg-white/[0.05]"
            >
              <i className="fas fa-pencil-alt text-[10px]"></i> Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                className="flex h-8 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-transparent px-3 text-xs font-medium text-white transition-colors hover:bg-white/[0.05]"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex h-8 items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-colors hover:bg-[#F4511E]"
                disabled={isSaving}
              >
                {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}"""

if settings_row_old in content:
    content = content.replace(settings_row_old, settings_row_new)
    print("Successfully replaced SettingsRow")
else:
    print("Could not find SettingsRow to replace")

# Write out to scratch file
with open('scratch/new_AdminSettingsContent.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
