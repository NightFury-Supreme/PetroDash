const fs = require('fs');
const file = 'frontend/src/components/panel/PanelContent.tsx';
let content = fs.readFileSync(file, 'utf-8');

const earlyReturnError = \  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 min-h-[60vh] py-12">
        <section className="text-center w-full max-w-[620px] px-4">
          <div className="mx-auto mb-[24px] flex items-center justify-center text-[#FF5722]">
            {(error.includes("Pending") || error.includes("pending")) ? (
              <RefreshCw strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] animate-spin" />
            ) : (
              <KeyRound strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />
            )}
          </div>
          <p className="m-0 mb-2.5 text-[#FF5722] text-[10px] font-semibold tracking-[0.12em] uppercase">
            {(error.includes("Pending") || error.includes("pending")) ? "Provisioning" : "Failed to Fetch"}
          </p>
          <h1 className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em] break-words">
            {error}
          </h1>
          <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
            {(error.includes("Pending") || error.includes("pending")) 
              ? "If you just registered, your account may still be provisioning. Please wait a moment and try refreshing the page."
              : "There was an issue retrieving your panel credentials. Please check your connection or contact support if the problem persists."}
          </p>
        </section>
      </div>
    );
  }

  return (
\;

content = content.replace('  return (\\r\\n    <div className="flex flex-col h-full space-y-6">', earlyReturnError + '    <div className="flex flex-col h-full space-y-6">');
content = content.replace('  return (\\n    <div className="flex flex-col h-full space-y-6">', earlyReturnError + '    <div className="flex flex-col h-full space-y-6">');

const inlineErrorRegex = /\\{\\s*error \\? \\([\\s\\S]*?\\) : \\(\\s*<>\\s*/;
content = content.replace(inlineErrorRegex, '');

content = content.replace(/<\\/>\\s*\\)\\}\\s*<\\/div>/, '</div>');

fs.writeFileSync(file, content);
console.log('Patched successfully.');
