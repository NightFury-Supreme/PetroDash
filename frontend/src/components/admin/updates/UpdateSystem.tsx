"use client";

import React, { useState, useEffect } from 'react';

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  releaseNotes: string;
  publishedAt: string;
  releaseUrl: string;
  fullDownloadUrl?: string;
  fullPackageSize?: number;
  fullPackageName?: string;
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
          <h2 className="text-xl font-bold text-white">System Version</h2>
          <p className="text-[#AAAAAA] text-sm">Check current and latest versions</p>
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
              {updateInfo.fullPackageName && (
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2">Package Information:</h4>
                  <div className="bg-[#0f0f0f] border border-[#303030] rounded-lg p-3">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[#AAAAAA]">Full Package</div>
                          <div className="text-white">{updateInfo.fullPackageName}</div>
                        </div>
                        {updateInfo.fullPackageSize && (
                          <div className="text-[#AAAAAA]">{(updateInfo.fullPackageSize / 1024 / 1024).toFixed(2)} MB</div>
                        )}
                      </div>
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

              <a
                href={updateInfo.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors"
              >
                <i className="fab fa-github mr-2"></i>
                View on GitHub
              </a>
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

      {/* Update progress removed */}

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

      {/* Important notice removed */}
    </div>
  );
}
