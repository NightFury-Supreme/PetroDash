import Link from 'next/link';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Control Panel Access
        </h1>
        <p className="text-[#AAAAAA] text-base sm:text-lg">
          Manage your game servers and services through the Pterodactyl control panel
        </p>
      </div>

      {/* Error Card */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-8">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <i className="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
          </div>

          {/* Error Message */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white">Unable to Load Panel Information</h2>
            <p className="text-[#AAAAAA] text-base max-w-md mx-auto">
              {error}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-redo"></i>
                Try Again
              </button>
            )}
            <Link
              href="/dashboard"
              className="bg-[#202020] hover:bg-[#272727] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
