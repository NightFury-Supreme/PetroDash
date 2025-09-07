"use client";

import React, { useState, useEffect } from 'react';

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  releaseUrl: string;
  packageSize?: number;
  packageName?: string;
}

interface UpdateStatus {
  status: 'idle' | 'starting' | 'backing_up' | 'downloading' | 'extracting' | 'applying' | 'installing_deps' | 'building' | 'completed' | 'failed';
  message: string;
  progress: number;
  timestamp: string;
  newVersion?: string;
  error?: string;
}

export default function UpdateSystem() {
  const [token, setToken] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for updates
  const checkForUpdates = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/updates/check`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check for updates');
      }

      const data = await response.json();
      setUpdateInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  // Apply update
  const applyUpdate = async () => {
    if (!updateInfo?.isUpdateAvailable) return;

    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/updates/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start update');
      }

      // Start polling for status
      pollUpdateStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start update');
      setIsUpdating(false);
    }
  };

  // Poll update status
  const pollUpdateStatus = async () => {
    const poll = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/updates/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const status = await response.json();
          setUpdateStatus(status);

          // Continue polling if update is in progress
          if (['starting', 'backing_up', 'downloading', 'extracting', 'applying', 'installing_deps', 'building'].includes(status.status)) {
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else if (status.status === 'completed') {
            setIsUpdating(false);
            // Refresh update info after completion
            setTimeout(checkForUpdates, 1000);
          } else if (status.status === 'failed') {
            setIsUpdating(false);
            setError(status.error || 'Update failed');
          }
        }
      } catch (err) {
        console.error('Error polling update status:', err);
        setIsUpdating(false);
      }
    };

    poll();
  };

  // Get token on component mount
  useEffect(() => {
    const getToken = () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        setToken(authToken);
      } catch (error) {
        console.error('Error getting auth token:', error);
        setToken(null);
      }
    };

    getToken();
  }, []);

  // Check for updates on component mount
  useEffect(() => {
    if (token) {
      checkForUpdates();
    }
  }, [token]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'idle': return 'text-gray-500';
      default: return 'text-blue-500';
    }
  };

  // Get progress bar color
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
          <i className="fas fa-sync-alt text-white text-lg"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">System Updates</h2>
          <p className="text-[#AAAAAA] text-sm">Check for and apply dashboard updates</p>
        </div>
      </div>

      {/* Current Version Info */}
      {updateInfo && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-[#202020] border border-[#303030] rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Current Version</h3>
              <p className="text-[#AAAAAA] text-sm">v{updateInfo.currentVersion}</p>
            </div>
            <div className="bg-[#202020] border border-[#303030] rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Latest Version</h3>
              <p className="text-[#AAAAAA] text-sm">v{updateInfo.latestVersion}</p>
            </div>
          </div>

          {/* Update Available */}
          {updateInfo.isUpdateAvailable && (
            <div className="bg-[#202020] border border-blue-500 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <i className="fas fa-exclamation-triangle text-blue-500"></i>
                <h3 className="text-white font-medium">Update Available!</h3>
              </div>
              <p className="text-[#AAAAAA] text-sm mb-3">
                A new version (v{updateInfo.latestVersion}) is available. 
                Published on {new Date(updateInfo.publishedAt).toLocaleDateString()}
              </p>
              
              {/* Package Information */}
              {updateInfo.packageName && (
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2">Package Information:</h4>
                  <div className="bg-[#0f0f0f] border border-[#303030] rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[#AAAAAA]">Package:</span>
                        <span className="text-white ml-2">{updateInfo.packageName}</span>
                      </div>
                      {updateInfo.packageSize && (
                        <div>
                          <span className="text-[#AAAAAA]">Size:</span>
                          <span className="text-white ml-2">{(updateInfo.packageSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Release Notes */}
              {updateInfo.releaseNotes && (
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2">Release Notes:</h4>
                  <div className="bg-[#0f0f0f] border border-[#303030] rounded-lg p-3 max-h-32 overflow-y-auto">
                    <pre className="text-[#AAAAAA] text-xs whitespace-pre-wrap">{updateInfo.releaseNotes}</pre>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={applyUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download mr-2"></i>
                      Update Now
                    </>
                  )}
                </button>
                <a
                  href={updateInfo.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors"
                >
                  <i className="fab fa-github mr-2"></i>
                  View on GitHub
                </a>
              </div>
            </div>
          )}

          {/* No Update Available */}
          {!updateInfo.isUpdateAvailable && (
            <div className="bg-[#202020] border border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <i className="fas fa-check-circle text-green-500"></i>
                <h3 className="text-white font-medium">You're up to date!</h3>
              </div>
              <p className="text-[#AAAAAA] text-sm mt-1">
                You are running the latest version (v{updateInfo.currentVersion})
              </p>
            </div>
          )}
        </div>
      )}

      {/* Update Status */}
      {updateStatus && updateStatus.status !== 'idle' && (
        <div className="mb-6">
          <div className="bg-[#202020] border border-[#303030] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Update Progress</h3>
              <span className={`text-sm font-medium ${getStatusColor(updateStatus.status)}`}>
                {updateStatus.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm text-[#AAAAAA] mb-1">
                <span>{updateStatus.message}</span>
                <span>{updateStatus.progress}%</span>
              </div>
              <div className="w-full bg-[#0f0f0f] rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(updateStatus.status)}`}
                  style={{ width: `${updateStatus.progress}%` }}
                ></div>
              </div>
            </div>

            {updateStatus.status === 'completed' && (
              <div className="bg-[#202020] border border-green-500 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-500"></i>
                  <span className="text-white font-medium">Update completed successfully!</span>
                </div>
                <p className="text-[#AAAAAA] text-sm mt-1">
                  Please restart the application to apply changes.
                </p>
              </div>
            )}

            {updateStatus.status === 'failed' && (
              <div className="bg-[#202020] border border-red-500 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <span className="text-white font-medium">Update failed</span>
                </div>
                <p className="text-[#AAAAAA] text-sm mt-1">
                  {updateStatus.error || 'An error occurred during the update process'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6">
          <div className="bg-[#202020] border border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-red-500"></i>
              <h3 className="text-white font-medium">Error</h3>
            </div>
            <p className="text-[#AAAAAA] text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={checkForUpdates}
          disabled={isChecking || isUpdating}
          className="px-4 py-2 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Checking...
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt mr-2"></i>
              Check for Updates
            </>
          )}
        </button>
      </div>

      {/* Warning */}
      <div className="mt-6 bg-[#202020] border border-yellow-500 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <i className="fas fa-exclamation-triangle text-yellow-500"></i>
          <h3 className="text-white font-medium">Important</h3>
        </div>
        <ul className="text-[#AAAAAA] text-sm mt-2 space-y-1">
          <li>• Updates will create a backup of your current installation</li>
          <li>• The application will need to be restarted after update completion</li>
          <li>• Make sure you have sufficient disk space for the update process</li>
          <li>• Updates are applied automatically and may take several minutes</li>
        </ul>
      </div>
    </div>
  );
}
