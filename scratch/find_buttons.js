const fs = require('fs');
const glob = require('glob');

const files = glob.sync('frontend/src/components/**/*Drawer.tsx').concat(glob.sync('frontend/src/components/**/*Modal.tsx'));

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const footerIndex = content.indexOf('footer={');
    if (footerIndex !== -1) {
        console.log(`\n\n=== ${file} ===`);
        const block = content.slice(footerIndex, footerIndex + 1500);
        
        const lines = block.split('\n');
        lines.forEach(line => {
            if (line.includes('<button') || line.includes('className=') || line.includes('ActionButton')) {
                console.log(line.trim());
            }
        });
    }
});
