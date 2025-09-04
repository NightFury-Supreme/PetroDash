import { ResourceInput } from './ResourceInput';

interface ResourceLimits {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
}

interface FormData extends ResourceLimits {
  name: string;
}

interface Violations {
  [key: string]: string;
}

interface ServerEditFormProps {
  form: FormData;
  remaining: ResourceLimits;
  exceeds: Record<keyof ResourceLimits, boolean>;
  violations: Violations;
  error: string | null;
  saving: boolean;
  isFormValid: boolean;
  onFormChange: (form: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
}

const resourceFields = [
  { key: 'diskMb' as keyof ResourceLimits, label: 'Disk Storage', unit: 'MB', min: 100, icon: 'fas fa-hdd' },
  { key: 'memoryMb' as keyof ResourceLimits, label: 'Memory', unit: 'MB', min: 128, icon: 'fas fa-memory' },
  { key: 'cpuPercent' as keyof ResourceLimits, label: 'CPU', unit: '%', min: 10, icon: 'fas fa-microchip' },
  { key: 'backups' as keyof ResourceLimits, label: 'Backups', unit: '', min: 0, icon: 'fas fa-save' },
  { key: 'databases' as keyof ResourceLimits, label: 'Databases', unit: '', min: 0, icon: 'fas fa-database' },
  { key: 'allocations' as keyof ResourceLimits, label: 'Allocations', unit: '', min: 1, icon: 'fas fa-network-wired' },
];

export function ServerEditForm({
  form,
  remaining,
  exceeds,
  violations,
  error,
  saving,
  isFormValid,
  onFormChange,
  onSubmit,
  onDelete
}: ServerEditFormProps) {
  const handleInputChange = (key: keyof FormData, value: string | number) => {
    onFormChange({ ...form, [key]: value });
  };

  return (
    <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 sm:p-8 space-y-6">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Server Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white">
            Server Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full bg-[#181818] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder="Enter server name"
            maxLength={50}
            required
          />
        </div>

        {/* Resource Limits Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-cogs text-blue-400"></i>
            <h3 className="text-lg font-semibold text-white">Resource Limits</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resourceFields.map(({ key, label, unit, min, icon }) => (
              <ResourceInput
                key={key}
                resourceKey={key}
                label={label}
                unit={unit}
                min={min}
                icon={icon}
                value={form[key]}
                remaining={remaining[key]}
                exceeds={exceeds[key]}
                violation={violations[key]}
                onChange={(value) => handleInputChange(key, value)}
              />
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400">
              <i className="fas fa-exclamation-circle"></i>
              <span className="font-semibold">Error</span>
            </div>
            <p className="text-red-300 mt-1">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-[#303030]">
          <button
            type="submit"
            disabled={!isFormValid || saving}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Updating...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Save Changes
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-trash"></i>
            Delete Server
          </button>
        </div>
      </form>
    </div>
  );
}

