const fs = require('fs');
const file = 'frontend/src/components/forgot/ForgotCard.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/setStep\("success"\);/, "showSuccess('Password updated successfully!');\n        setTimeout(() => router.replace('/login'), 1500);");
c = c.replace(/if \(step === "success"\) \{[\s\S]*?return \([\s\S]*?<\i className="fas fa-arrow-right"><\/i> Go to Login[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}/, "");

fs.writeFileSync(file, c);
