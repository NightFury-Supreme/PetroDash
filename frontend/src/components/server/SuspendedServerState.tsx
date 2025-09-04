import { useRouter } from 'next/navigation';

export function SuspendedServerState() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
        <div className="text-yellow-400 text-lg font-semibold mb-2">Server Suspended</div>
        <div className="text-gray-400 mb-4">
          This server has been suspended and cannot be modified. Please contact support for assistance.
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

