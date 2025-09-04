import { useState } from 'react';

interface PanelInfo {
  email: string;
  username: string;
  panelUrl: string;
  loginUrl: string;
}

interface PanelContentProps {
  info: PanelInfo;
  error: string | null;
  resetting: boolean;
  newPassword: string | null;
  onResetPassword: () => Promise<void>;
  onClearError: () => void;
  onClearNewPassword: () => void;
}

export function PanelContent({
  info,
  error,
  resetting,
  newPassword,
  onResetPassword,
  onClearError,
  onClearNewPassword,
}: PanelContentProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async () => {
    if (confirm('Are you sure you want to reset your panel password? This will invalidate your current password.')) {
      await onResetPassword();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Control Panel Access
        </h1>
        <p className="text-[#AAAAAA] text-base sm:text-lg">
          Manage your game servers and services through the Pterodactyl control panel
        </p>
      </div>

      {/* Main Panel Card */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl overflow-hidden shadow-lg">
        {/* Card Header */}
        <div className="p-6 border-b border-[#303030]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
              <i className="fas fa-server text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Game Server Management</h2>
              <p className="text-[#AAAAAA] text-sm">Access your hosted services and manage server configurations</p>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <i className="fas fa-exclamation-triangle text-red-400"></i>
                <div>
                  <div className="font-semibold text-red-400">Error</div>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={onClearError}
                  className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {/* Success Message for New Password */}
          {newPassword && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <i className="fas fa-check-circle text-green-400"></i>
                <div>
                  <div className="font-semibold text-green-400">Password Reset Successful</div>
                  <p className="text-green-300 text-sm mt-1">
                    Your new password has been generated. Please save it securely.
                  </p>
                </div>
                <button
                  onClick={onClearNewPassword}
                  className="ml-auto text-green-400 hover:text-green-300 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {/* Panel Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Panel Credentials</h3>
              <p className="text-[#AAAAAA] text-sm">
                Use these credentials to access your Pterodactyl control panel
              </p>
            </div>

            {/* Credentials Display */}
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#AAAAAA]">Email Address</label>
                <div className="flex items-center gap-3 p-3 bg-[#202020] border border-[#404040] rounded-lg">
                  <i className="fas fa-envelope text-[#AAAAAA]"></i>
                  <span className="text-white font-medium">{info.email}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(info.email)}
                    className="ml-auto text-[#AAAAAA] hover:text-white transition-colors"
                    title="Copy email"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#AAAAAA]">Password</label>
                <div className="flex items-center gap-3 p-3 bg-[#202020] border border-[#404040] rounded-lg">
                  <i className="fas fa-lock text-[#AAAAAA]"></i>
                  <span className="text-white font-medium">
                    {newPassword ? (
                      showPassword ? newPassword : '••••••••••••••••'
                    ) : (
                      'Click "Reset Password" to generate a new password'
                    )}
                  </span>
                  {newPassword && (
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#AAAAAA] hover:text-white transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  )}
                  {newPassword && (
                    <button
                      onClick={() => navigator.clipboard.writeText(newPassword)}
                      className="text-[#AAAAAA] hover:text-white transition-colors"
                      title="Copy password"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Panel URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#AAAAAA]">Panel URL</label>
                <div className="flex items-center gap-3 p-3 bg-[#202020] border border-[#404040] rounded-lg">
                  <i className="fas fa-link text-[#AAAAAA]"></i>
                  <span className="text-white font-medium">{info.panelUrl}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(info.panelUrl)}
                    className="ml-auto text-[#AAAAAA] hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <button
              onClick={handleResetPassword}
              disabled={resetting}
              className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {resetting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Resetting...
                </>
              ) : (
                <>
                  <i className="fas fa-key"></i>
                  Reset Password
                </>
              )}
            </button>
            
            <a
              href={info.loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <i className="fas fa-external-link-alt"></i>
              Open Control Panel
            </a>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Important Information</h3>
                     <div className="space-y-3 text-sm text-[#AAAAAA]">
             <div className="flex items-start gap-3">
               <i className="fas fa-info-circle text-white mt-0.5"></i>
               <p>Your panel credentials are separate from your main account login</p>
             </div>
             <div className="flex items-start gap-3">
               <i className="fas fa-shield-alt text-white mt-0.5"></i>
               <p>Keep your panel password secure and don't share it with others</p>
             </div>
             <div className="flex items-start gap-3">
               <i className="fas fa-sync-alt text-white mt-0.5"></i>
               <p>You can reset your panel password at any time using the button above</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
