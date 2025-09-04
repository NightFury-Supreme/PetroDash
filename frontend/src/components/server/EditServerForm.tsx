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

interface EditServerFormProps {
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

export function EditServerForm({
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
}: EditServerFormProps) {
  const handleInputChange = (key: keyof FormData, value: string | number) => {
    onFormChange({ ...form, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Server Details Section */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Server Details</h3>
          <p className="text-gray-400 text-sm">Configure your server's basic information</p>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white">
            Server Name <span className="text-red-400">*</span>
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
      </div>

      {/* Resource Limits Section */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Resource Limits</h3>
          <p className="text-gray-400 text-sm">Configure your server's resource allocation</p>
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
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400">
            <i className="fas fa-exclamation-circle"></i>
            <span className="font-semibold">Error</span>
          </div>
          <p className="text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <i className="fas fa-trash"></i>
          Delete Server
        </button>
        
        <button
          type="button"
          disabled={!isFormValid || saving}
          onClick={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}
          className="flex-1 sm:flex-none bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
