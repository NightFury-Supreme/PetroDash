"use client";

import { useState, useEffect } from 'react';
import '../styles/adblocker-modal.css';

interface AdBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function AdBlockerModal({ isOpen, onClose, onRetry }: AdBlockerModalProps) {
  const [browser, setBrowser] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Detect browser
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('chrome')) {
        setBrowser('Chrome');
      } else if (userAgent.includes('firefox')) {
        setBrowser('Firefox');
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        setBrowser('Safari');
      } else if (userAgent.includes('edge')) {
        setBrowser('Edge');
      } else if (userAgent.includes('brave')) {
        setBrowser('Brave');
      } else {
        setBrowser('your browser');
      }

      // Prevent right-click, F12, and other dev tools
      const preventDevTools = (e: KeyboardEvent) => {
        if (e.key === 'F12' || e.key === 'F11' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      const preventContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      // Add event listeners
      document.addEventListener('keydown', preventDevTools, true);
      document.addEventListener('contextmenu', preventContextMenu, true);
      document.addEventListener('selectstart', (e) => e.preventDefault(), true);
      document.addEventListener('dragstart', (e) => e.preventDefault(), true);

      // Cleanup
      return () => {
        document.removeEventListener('keydown', preventDevTools, true);
        document.removeEventListener('contextmenu', preventContextMenu, true);
        document.removeEventListener('selectstart', (e) => e.preventDefault(), true);
        document.removeEventListener('dragstart', (e) => e.preventDefault(), true);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="adblocker-modal-overlay flex items-center justify-center p-4"
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'F12' || e.key === 'F11' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();
        }
      }}
    >
      <div className="bg-[#181818] border border-[#303030] rounded-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ad Blocker Detected</h2>
              <p className="text-[#AAAAAA] text-sm">Please disable your ad blocker</p>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#202020] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-2xl text-white"></i>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Turn off ad blocker in {browser}
            </h3>
            <p className="text-[#AAAAAA] text-sm mb-4">
              Look for the ad blocker icon in your browser toolbar and disable it for this site.
            </p>
            
            {/* Quick instructions based on browser */}
            <div className="bg-[#202020] border border-[#303030] rounded-lg p-3 text-left">
              <p className="text-white text-sm font-medium mb-2">Quick steps:</p>
              <ul className="text-[#AAAAAA] text-xs space-y-1">
                {browser === 'Brave' && (
                  <>
                    <li>• Click the Brave shield icon in the address bar</li>
                    <li>• Turn off "Shields" for this site</li>
                    <li>• Or go to Settings → Shields → Advanced controls</li>
                  </>
                )}
                {browser === 'Chrome' && (
                  <>
                    <li>• Click the ad blocker extension icon in toolbar</li>
                    <li>• Select "Pause on this site" or "Disable"</li>
                    <li>• Or go to Extensions → Ad blocker → Site access</li>
                  </>
                )}
                {browser === 'Firefox' && (
                  <>
                    <li>• Click the shield icon in the address bar</li>
                    <li>• Turn off "Enhanced Tracking Protection"</li>
                    <li>• Or go to about:preferences#privacy</li>
                  </>
                )}
                {browser === 'Safari' && (
                  <>
                    <li>• Go to Safari → Preferences → Websites</li>
                    <li>• Select "Content Blockers" from sidebar</li>
                    <li>• Set this site to "Off"</li>
                  </>
                )}
                {browser === 'Edge' && (
                  <>
                    <li>• Click the shield icon in the address bar</li>
                    <li>• Turn off "Tracking prevention"</li>
                    <li>• Or go to Settings → Privacy, search, and services</li>
                  </>
                )}
                {!['Chrome', 'Firefox', 'Safari', 'Edge', 'Brave'].includes(browser) && (
                  <>
                    <li>• Look for ad blocker icons in your toolbar</li>
                    <li>• Click the ad blocker icon</li>
                    <li>• Find "Pause", "Disable", or "Whitelist" options</li>
                    <li>• Add this site to the allow list</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="w-full px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Reload Page
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-[#303030]">
            <p className="text-[#666666] text-xs text-center">
              <i className="fas fa-info-circle mr-1"></i>
              Ads help us provide free services to our users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
