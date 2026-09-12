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
  const [, _setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [, _setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for updates
  const checkForUpdates = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/updates/check`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check for updates');
      }

      let data: any = {}; try { data = await response.json(); } catch {}
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


  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">System Updates</h3>
            <p className="mt-2 text-sm text-white/35">Check current and latest versions</p>
          </div>
        </div>

      {/* Current Version Info */}
      {updateInfo ? (
        <div className="divide-y divide-white/[0.06]">
          <div className="px-5 py-5 transition hover:bg-white/[0.02]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-[#D4D4D4]">Current Version</p>
                <div className="mt-0.5 text-[13px] text-[#888]">v{updateInfo.currentVersion}</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#D4D4D4]">Latest Version</p>
                <div className="mt-0.5 text-[13px] text-[#888]">v{updateInfo.latestVersion}</div>
              </div>
            </div>
          </div>

          {/* Update Available */}
          {updateInfo.isUpdateAvailable && (
            <div className="px-5 py-5 bg-blue-500/5">
              <div className="flex items-center gap-3 mb-3">
                <i className="fas fa-exclamation-triangle text-blue-400"></i>
                <h3 className="text-white font-medium">Update Available!</h3>
              </div>
              <p className="text-[#AAAAAA] text-sm mb-4">
                A new version (v{updateInfo.latestVersion}) is available. 
                Published on {new Date(updateInfo.publishedAt).toLocaleDateString()}
              </p>
              
              {/* Package Information */}
              {updateInfo.fullPackageName && (
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2 text-sm">Package Information:</h4>
                  <div className="bg-black/20 border border-white/[0.06] rounded-lg p-3">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[#AAAAAA] text-xs">Full Package</div>
                          <div className="text-[#D4D4D4]">{updateInfo.fullPackageName}</div>
                        </div>
                        {updateInfo.fullPackageSize && (
                          <div className="text-[#AAAAAA] text-xs">{(updateInfo.fullPackageSize / 1024 / 1024).toFixed(2)} MB</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Release Notes */}
              {updateInfo.releaseNotes && (
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2 text-sm">Release Notes:</h4>
                  <div className="bg-black/20 border border-white/[0.06] rounded-lg p-3 max-h-32 overflow-y-auto">
                    <pre className="text-[#AAAAAA] text-xs whitespace-pre-wrap">{updateInfo.releaseNotes}</pre>
                  </div>
                </div>
              )}

              <a
                href={updateInfo.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-white/[0.05] border border-white/[0.06] text-white rounded-lg text-sm font-medium hover:bg-white/[0.1] transition-colors"
              >
                <i className="fab fa-github mr-2"></i>
                View on GitHub
              </a>
            </div>
          )}

          {/* No Update Available */}
          {!updateInfo.isUpdateAvailable && (
            <div className="px-5 py-5 bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <i className="fas fa-check-circle text-emerald-400"></i>
                <h3 className="text-white font-medium">You're up to date!</h3>
              </div>
              <p className="text-[#AAAAAA] text-sm mt-1">
                You are running the latest version (v{updateInfo.currentVersion})
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-8 flex flex-col items-center justify-center text-center">
          <i className="fas fa-sync-alt text-[#444] text-3xl mb-3"></i>
          <p className="text-[#888] text-sm">Check for updates to see if a newer version is available.</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-5 py-4 border-t border-red-500/10 bg-red-500/5">
          <div className="flex items-center gap-3">
            <i className="fas fa-exclamation-circle text-red-400"></i>
            <h3 className="text-white font-medium text-sm">Error</h3>
          </div>
          <p className="text-[#AAAAAA] text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-white/[0.06] pt-5 mt-2 flex items-center justify-between">
        <button
          onClick={checkForUpdates}
          disabled={isChecking}
          className="px-5 py-2.5 bg-white/[0.05] border border-white/[0.06] text-white rounded-lg text-sm font-medium hover:bg-white/[0.1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isChecking ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Checking...
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt"></i>
              Check for Updates
            </>
          )}
        </button>
      </div>
    </section>
  );
}
