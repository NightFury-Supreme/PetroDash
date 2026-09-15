const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const replaceRegex = [
        {
          regex: /className="([^"]*bg-\[\#FF5722\][^"]*)"/g,
          replacer: (match, p1) => {
            let cls = p1;
            cls = cls.replace(/\bpx-[56]\b/g, 'px-4');
            cls = cls.replace(/\bpy-2\.5\b/g, 'py-2');
            cls = cls.replace(/\bborder border-\[\#FF5722\]\b/g, '');
            cls = cls.replace(/\bmin-w-\[140px\]\b/g, '');
            cls = cls.replace(/\bhover:bg-\[\#F4511E\]\b/g, 'hover:bg-[#ff6939]');
            cls = cls.replace(/\s+/g, ' ').trim();
            if (p1 !== cls) return `className="${cls}"`;
            return match;
          }
        },
        {
          regex: /className="([^"]*text-\[\#888\][^"]*)"/g,
          replacer: (match, p1) => {
            let cls = p1;
            // Only modify if it looks like a Cancel button (has text-[#888] and some hover)
            if (cls.includes('hover:text-white') || cls.includes('hover:text-[#D4D4D4]')) {
                if (!cls.includes('bg-transparent')) cls = cls + ' bg-transparent';
                if (!cls.includes('border border-[#222]')) cls = cls + ' border border-[#222]';
                if (!cls.includes('rounded-lg')) cls = cls + ' rounded-lg';
                cls = cls.replace(/\bpy-2\.5\b/g, 'py-2');
                cls = cls.replace(/\bhover:text-white\b/g, 'hover:text-[#D4D4D4]');
                cls = cls.replace(/\s+/g, ' ').trim();
            }
            if (p1 !== cls) return `className="${cls}"`;
            return match;
          }
        },
        {
          regex: /className="([^"]*bg-red-500\/10[^"]*)"/g,
          replacer: (match, p1) => {
            let cls = p1;
            cls = cls.replace(/\bpy-2\.5\b/g, 'py-2');
            cls = cls.replace(/\s+/g, ' ').trim();
            if (p1 !== cls) return `className="${cls}"`;
            return match;
          }
        }
      ];

      for (const rule of replaceRegex) {
        content = content.replace(rule.regex, rule.replacer);
      }

      if (content !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, '../frontend/src/components'));
