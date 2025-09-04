interface AdminShopErrorProps {
  error: string | null;
}

export function AdminShopError({ error }: AdminShopErrorProps) {
  if (!error) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <i className="fas fa-exclamation-triangle text-red-400"></i>
        <span className="text-red-400 font-medium">{error}</span>
      </div>
    </div>
  );
}

