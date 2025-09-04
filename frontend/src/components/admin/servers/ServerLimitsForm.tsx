"use client";

export default function ServerLimitsForm({ limits, onChange }: { limits: any; onChange: (field: string, value: number) => void }) {
  return (
    <div className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <h2 className="text-xl font-bold mb-6">Resource Limits</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">CPU Limit (%)</label>
          <input
            type="number"
            value={limits.cpuPercent}
            onChange={(e) => onChange('cpuPercent', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">Maximum CPU usage percentage</p>
        </div>
        <div>
          <label className="label">Memory Limit (MB)</label>
          <input
            type="number"
            value={limits.memoryMb}
            onChange={(e) => onChange('memoryMb', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">Maximum RAM usage in megabytes</p>
        </div>
        <div>
          <label className="label">Disk Limit (MB)</label>
          <input
            type="number"
            value={limits.diskMb}
            onChange={(e) => onChange('diskMb', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">Maximum disk usage in megabytes</p>
        </div>
        <div>
          <label className="label">Allocation Limit</label>
          <input
            type="number"
            value={limits.allocations}
            onChange={(e) => onChange('allocations', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">Maximum number of ports/allocations</p>
        </div>
        <div>
          <label className="label">Backup Limit</label>
          <input
            type="number"
            value={limits.backups}
            onChange={(e) => onChange('backups', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">Maximum number of backups</p>
        </div>
        <div>
          <label className="label">Database Limit</label>
          <input
            type="number"
            value={limits.databases}
            onChange={(e) => onChange('databases', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">Maximum number of databases</p>
        </div>
      </div>
    </div>
  );
}


