const fs = require('fs');
const path = require('path');
const srcDir = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile';

function traverse(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) traverse(p);
    else if (p.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      
      const regex = /else\s+const errKey = (.*?);\s+showError\((.*?)\);/g;
      
      if (regex.test(content)) {
        content = content.replace(regex, (match, g1, g2) => {
          return `else {\n  const errKey = ${g1};\n  showError(${g2});\n}`;
        });
        fs.writeFileSync(p, content);
        console.log('Fixed:', p);
      }
    }
  });
}
traverse(srcDir);
