"use client";

import { useState } from 'react';
import { AdSense } from './AdSense';

export function AdBlockerTest() {
  const [debugMode, setDebugMode] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold">Ad Blocker Test</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Debug Mode</span>
        </label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Header Ad</h4>
          <AdSense
            publisherId="ca-pub-0000000000000000"
            adSlot="0000000000"
            position="header"
            debugMode={debugMode}
            adStyle={{ minHeight: '90px' }}
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Content Ad</h4>
          <AdSense
            publisherId="ca-pub-0000000000000000"
            adSlot="0000000000"
            position="content"
            debugMode={debugMode}
            adStyle={{ minHeight: '250px' }}
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Sidebar Ad</h4>
          <AdSense
            publisherId="ca-pub-0000000000000000"
            adSlot="0000000000"
            position="sidebar"
            debugMode={debugMode}
            adStyle={{ minHeight: '600px' }}
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Footer Ad</h4>
          <AdSense
            publisherId="ca-pub-0000000000000000"
            adSlot="0000000000"
            position="footer"
            debugMode={debugMode}
            adStyle={{ minHeight: '90px' }}
          />
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Enable debug mode to see detailed logging in console</li>
          <li>Test with and without ad blockers enabled</li>
          <li>Check browser console for debug messages</li>
          <li>Try different ad blocker extensions (uBlock Origin, AdBlock, etc.)</li>
        </ul>
      </div>
    </div>
  );
}
