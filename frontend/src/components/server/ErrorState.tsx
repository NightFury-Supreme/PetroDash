import { useRouter } from 'next/navigation';

interface ErrorStateProps {
  error: string;
  title?: string;
  actionLabel?: string;
  actionPath?: string;
}

export function ErrorState({ 
  error, 
  title = "Error Loading Server", 
  actionLabel = "Return to Dashboard",
  actionPath = "/dashboard"
}: ErrorStateProps) {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <div className="text-red-400 text-lg font-semibold mb-2">{title}</div>
        <div className="text-gray-400 mb-4">{error}</div>
        <button 
          onClick={() => router.push(actionPath)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

