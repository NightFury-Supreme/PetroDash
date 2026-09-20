const fs = require('fs');

const addKeys = (lang) => {
  const p = `c:/Users/Edwin Jilson/Downloads/project/frontend/messages/${lang}.json`;
  if (!fs.existsSync(p)) return;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  
  if (d.Profile) {
    if (!d.Profile.saved) d.Profile.saved = lang === 'hi' ? 'सेव हो गया' : 'Saved';
    if (!d.Profile.coins) d.Profile.coins = lang === 'hi' ? 'सिक्के' : 'coins';
    if (!d.Profile.notSet) d.Profile.notSet = lang === 'hi' ? 'सेट नहीं है' : 'Not set';
    fs.writeFileSync(p, JSON.stringify(d, null, 2));
  }
};

['en', 'hi', 'fr', 'ja', 'es', 'zh'].forEach(addKeys);
console.log('Added Profile keys');
