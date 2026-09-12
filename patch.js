const fs = require('fs');
const file = 'frontend/src/components/panel/PanelContent.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Add imports
content = content.replace(
  'import { Copy, ExternalLink, KeyRound, Link2, Mail, RefreshCw } from "lucide-react";',
  'import { Copy, ExternalLink, KeyRound, Link2, Mail, RefreshCw } from "lucide-react";\nimport { ErrorState, DashboardButton } from "@/components/ui/ErrorState";'
);

// Replace empty state
const emptyStateRegex = /<div className="flex flex-col items-center justify-center w-full flex-1 min-h-\[calc\(100vh-200px\)\] py-12">[\s\S]*?<\/div>\s*\);\s*}\s*return \(/m;

const newEmptyState = `<ErrorState
        icon={
          (error.includes("Pending") || error.includes("pending")) ? (
            <RefreshCw strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] animate-spin" />
          ) : (
            <KeyRound strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />
          )
        }
        kicker={(error.includes("Pending") || error.includes("pending")) ? "Provisioning" : "Failed to Fetch"}
        title={error}
        description={
          <p>
            {(error.includes("Pending") || error.includes("pending")) 
              ? "If you just registered, your account may still be provisioning. Please wait a moment and try refreshing the page."
              : "There was an issue retrieving your panel credentials. Please check your connection or contact support if the problem persists."}
          </p>
        }
        buttons={
          <>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <RefreshCw className="w-[14px] h-[14px]" />
              Refresh
            </button>
            <DashboardButton />
          </>
        }
      />
    );
  }

  return (`;

content = content.replace(emptyStateRegex, newEmptyState);
fs.writeFileSync(file, content);
console.log('PanelContent updated');
