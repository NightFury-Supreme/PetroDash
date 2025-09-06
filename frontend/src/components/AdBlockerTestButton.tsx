"use client";

import { useState } from 'react';

export function AdBlockerTestButton() {
  const [result, setResult] = useState<string>('');

  const testAdBlocker = async () => {
    setResult('Testing...');
    
    try {
      // Test ad blocker detection
      const testAd = document.createElement('div');
      testAd.innerHTML = 'Advertisement';
      testAd.className = 'adsbox';
      testAd.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
      testAd.setAttribute('data-ad-test', 'true');
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0 || testAd.offsetWidth === 0 || 
                         getComputedStyle(testAd).display === 'none' ||
                         getComputedStyle(testAd).visibility === 'hidden';
        
        document.body.removeChild(testAd);
        
        // Check for common ad blocker globals
        const adBlockerGlobals = [
          'uBlock', 'AdBlock', 'adblock', 'uBlockOrigin', 'AdGuard', 'Ghostery',
          'privacyBadger', 'braveAdBlock', 'adblockplus', 'adnauseam', 'ublock0',
          'adguard', 'ghostery', 'privacybadger', 'disconnect', 'duckduckgo', 'pihole'
        ];
        
        let foundGlobals = [];
        for (const global of adBlockerGlobals) {
          if (window[global as any] !== undefined) {
            foundGlobals.push(global);
          }
        }
        
        // Check for Brave browser
        const isBrave = (navigator as any).brave && (navigator as any).brave.isBrave;
        
        // Check if AdSense script is available
        const scriptAvailable = !!(window as any).adsbygoogle;
        
        let resultText = `Ad Blocker Test Results:\n\n`;
        resultText += `Element Blocked: ${isBlocked ? 'YES' : 'NO'}\n`;
        resultText += `Script Available: ${scriptAvailable ? 'YES' : 'NO'}\n`;
        resultText += `Brave Browser: ${isBrave ? 'YES' : 'NO'}\n`;
        resultText += `Found Globals: ${foundGlobals.length > 0 ? foundGlobals.join(', ') : 'NONE'}\n\n`;
        
        if (isBlocked || !scriptAvailable || foundGlobals.length > 0 || isBrave) {
          resultText += `RESULT: Ad Blocker DETECTED`;
        } else {
          resultText += `RESULT: No Ad Blocker detected`;
        }
        
        setResult(resultText);
      }, 200);
    } catch (error) {
      setResult(`Error: ${error}`);
    }
  };

  return (
    <div className="p-4 bg-[#181818] border border-[#303030] rounded-lg">
      <h3 className="text-white font-medium mb-2">Ad Blocker Test</h3>
      <button
        onClick={testAdBlocker}
        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors mb-3"
      >
        Test Ad Blocker Detection
      </button>
      {result && (
        <pre className="text-xs text-[#AAAAAA] bg-[#202020] p-3 rounded border border-[#303030] whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
