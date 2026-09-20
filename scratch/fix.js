const fs = require('fs');
let code = fs.readFileSync('c:/Users/Edwin Jilson/Downloads/project/scratch/refactor-profile.js', 'utf8');
code = code.replace(/\\`/g, '`');
fs.writeFileSync('c:/Users/Edwin Jilson/Downloads/project/scratch/refactor-profile.js', code);
