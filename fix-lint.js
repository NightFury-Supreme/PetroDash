const fs = require('fs');
const execSync = require('child_process').execSync;

try {
  const output = execSync('npx eslint . --format json', { cwd: 'c:/Users/Edwin Jilson/Downloads/project/frontend', encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
} catch (e) {
  const results = JSON.parse(e.stdout);
  results.forEach(file => {
    if (file.errorCount === 0 && file.warningCount === 0) return;
    
    let content = fs.readFileSync(file.filePath, 'utf8');
    
    // Reverse sort messages by line and column to replace from bottom to top without shifting indices
    const messages = file.messages.filter(m => m.ruleId === 'unused-imports/no-unused-vars').sort((a, b) => {
      if (a.line !== b.line) return b.line - a.line;
      return b.column - a.column;
    });

    // Instead of complex AST replacements, we can do targeted string replacements if it's just 'showSuccess'
    // Actually a simpler regex replace across the file for known unused variables:
    // e.g. const { showSuccess, showError } = useToast(); -> const { showError } = useToast();
    
    content = content.replace(/showSuccess,\s*/g, '');
    content = content.replace(/,\s*showSuccess/g, '');
    content = content.replace(/const { showSuccess } = useToast\(\);\s*/g, '');
    
    content = content.replace(/router,\s*/g, '');
    content = content.replace(/,\s*router/g, '');
    content = content.replace(/const router = useRouter\(\);\s*/g, '');
    
    content = content.replace(/,\s*saving/g, '');
    content = content.replace(/saving,\s*/g, '');
    
    content = content.replace(/catch \(e\)/g, 'catch');

    content = content.replace(/adsSessionId,\s*/g, '');
    content = content.replace(/adsProvider,\s*/g, '');
    
    content = content.replace(/url,\s*/g, '');
    
    content = content.replace(/,\s*vertical = false/g, '');
    content = content.replace(/vertical = false,\s*/g, '');
    content = content.replace(/,\s*vertical\?: boolean/g, '');
    content = content.replace(/vertical\?: boolean,\s*/g, '');
    
    fs.writeFileSync(file.filePath, content);
  });
}
