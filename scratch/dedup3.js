const fs = require('fs');
const path = require('path');

function fixDups(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (f.endsWith('.tsx') && !f.includes('ProfileForms')) {
      let content = fs.readFileSync(p, 'utf8');
      
      // Remove self-imports
      const baseName = path.basename(f, '.tsx');
      const re = new RegExp('import \\{\\s*' + baseName + '\\s*\\} from [\'"].*[\'"].*\n', 'g');
      content = content.replace(re, '');
      
      // Also remove any imports of React, Session, etc that are defined multiple times
      // We will just do a simple line deduplication for imports
      const lines = content.split('\n');
      const newLines = [];
      const seen = new Set();
      
      for (let line of lines) {
        if (line.trim().startsWith('import ')) {
          const m = line.trim();
          if (seen.has(m)) continue;
          seen.add(m);
        }
        newLines.push(line);
      }
      
      fs.writeFileSync(p, newLines.join('\n'));
      console.log('Fixed', p);
    }
  });
}

fixDups('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs');
fixDups('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui');
