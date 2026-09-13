"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, FileText, Github } from 'lucide-react';

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

  useEffect(() => {
    if (token) {
      checkForUpdates();
    }
  }, [token]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-white tracking-tight">System Updates</h3>
        <p className="mt-1 text-sm text-[#888888]">Check current and latest versions</p>
      </div>

      {/* Version Info Row */}
      {updateInfo && (
        <div>
          {updateInfo.isUpdateAvailable ? (
            <div className="flex items-start gap-3 py-4 border-t border-b border-white/[0.06]">
              <AlertTriangle className="w-4 h-4 text-[#FF5722] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-white">Update Available</p>
                  <span className="text-xs font-mono text-[#FF5722]">v{updateInfo.currentVersion} → v{updateInfo.latestVersion}</span>
                </div>
                <p className="text-xs text-[#888] mt-0.5">
                  Published on {new Date(updateInfo.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>


                {updateInfo.releaseNotes && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#666] mb-1.5">
                      <FileText className="w-3 h-3" />
                      Release Notes
                    </div>
                    <div className="bg-black/20 rounded-md p-3 max-h-28 overflow-y-auto border border-white/[0.04]">
                      <pre className="text-[#888] text-xs whitespace-pre-wrap font-sans leading-relaxed">{updateInfo.releaseNotes}</pre>
                    </div>
                  </div>
                )}

                <a
                  href={updateInfo.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  View on GitHub
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-4 border-t border-b border-white/[0.06]">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-white">You&apos;re up to date!</p>
                  <span className="text-xs font-mono text-white">v{updateInfo.currentVersion}</span>
                </div>
                <p className="text-xs text-[#888] mt-0.5">You are running the latest version</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no data yet */}
      {!updateInfo && !isChecking && !error && (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-[#333] mb-3" />
          <p className="text-[#666] text-sm">Click &quot;Check for Updates&quot; to see if a newer version is available.</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/[0.06] border border-red-500/20">
          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Failed to check for updates</p>
            <p className="text-xs text-[#888] mt-0.5">{error}</p>
          </div>
        </div>
      )}

    </section>
  );
}
