const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/drawers';

fs.readdirSync(dir).forEach(f => {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  
  if (!c.includes('import { useMemo }')) {
    c = "import { useMemo } from 'react';\n" + c;
  }
  
  if (f === 'DeleteAccountDrawer.tsx' && !c.includes('import { Trash2 }')) {
    c = "import { Trash2 } from 'lucide-react';\n" + c;
  }
  
  fs.writeFileSync(p, c);
});
console.log('Fixed useMemo');
