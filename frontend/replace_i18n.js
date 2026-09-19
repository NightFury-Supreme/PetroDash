const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        if (!file.endsWith('routing.ts') && !file.endsWith('middleware.ts')) {
            results.push(file);
        }
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let changed = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  content = content.replace(/from\s+['"]next\/navigation['"]/g, 'from "@/i18n/routing"');
  content = content.replace(/from\s+['"]next\/link['"]/g, 'from "@/i18n/routing"');
  // if next/link was default imported as Link, change it to named import
  content = content.replace(/import\s+Link\s+from\s+['"]@\/i18n\/routing['"]/g, 'import { Link } from "@/i18n/routing"');
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    changed++;
  }
});
console.log('Changed ' + changed + ' files.');
