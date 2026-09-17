const fs = require('fs');
const file = 'frontend/src/components/verify/VerifyCard.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/import AuthHeader from "@\/components\/auth\/AuthHeader";/, "import { useToast } from '@/components/ui/ToastProvider';");

c = c.replace(/const \[error, setError\] = useState<string \| null>\(null\);\n?/g, '');
c = c.replace(/const \[success, setSuccess\] = useState<string \| null>\(null\);\n?/g, '');

c = c.replace(/const router = useRouter\(\);/, "const router = useRouter();\n  const { showError, showSuccess } = useToast();");

c = c.replace(/setError\(null\);\n?/g, '');
c = c.replace(/setSuccess\(null\);\n?/g, '');
c = c.replace(/setError\(/g, 'showError(');
c = c.replace(/setSuccess\(/g, 'showSuccess(');

// Remove the inline JSX for error and success
c = c.replace(/\{error && <div[^>]+>\{error\}<\/div>\}\n?/g, '');
c = c.replace(/\{success && !success\.toLowerCase\(\)\.includes\('email verified'\) && \([\s\S]*?\)\}\n?/g, '');
c = c.replace(/\{error && \([\s\S]*?\)\}\n?/g, '');

// Since success state is gone, we can't do if (success && ...) at the top level
c = c.replace(/if \(success && success\.toLowerCase\(\)\.includes\('email verified'\)\) \{/, 'if (false) {');

fs.writeFileSync(file, c);
