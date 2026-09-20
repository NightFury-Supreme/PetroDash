const fs = require('fs');
const p = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/ActiveSessionsTab.tsx';
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/parseUserAgent\(session\.browser\) :/, "parseUserAgent(session.browser).browser :");
content = content.replace(/parseUserAgent\(session\.browser\) \}/, "parseUserAgent(session.browser).browser }");
fs.writeFileSync(p, content);
console.log('Fixed ActiveSessionsTab');
