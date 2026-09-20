const fs = require('fs');
const path = require('path');

function fix(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (f.endsWith('.tsx') && !f.includes('ProfileForms')) {
      let content = fs.readFileSync(p, 'utf8');
      
      // Match multi-line and single-line imports from lucide-react
      // We will remove all of them.
      content = content.replace(/import\s*\{[^}]*\}\s*from\s+['"]lucide-react['"];?/g, '');
      
      // Now inject one single line import at the top
      content = 'import { User, Mail, ShieldCheck, Camera, Check, Pencil, KeyRound, Save, Smartphone, Globe, LogOut, Clock3, Laptop, AlertCircle, Download, Loader2 } from "lucide-react";\n' + content;
      
      fs.writeFileSync(p, content);
      console.log('Fixed', p);
    }
  });
}

fix('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs');
fix('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui');
