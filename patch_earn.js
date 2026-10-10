const fs = require('fs');
const file = 'frontend/src/components/earn/EarnList.tsx';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes("import Link from 'next/link';")) {
  content = content.replace("import React from 'react';", "import React from 'react';\nimport Link from 'next/link';");
}

const buttonsHtml = \
          <div className="mt-[29px] flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
          </div>
\;

// Replace first block
content = content.replace(
  'administrator to enable earning methods to start collecting coins.\\n          </p>',
  'administrator to enable earning methods to start collecting coins.\\n          </p>' + buttonsHtml
);

// Replace second block
content = content.replace(
  'platform. Please check back later.\\n            </p>',
  'platform. Please check back later.\\n            </p>' + buttonsHtml
);

fs.writeFileSync(file, content);
console.log('EarnList patched.');
