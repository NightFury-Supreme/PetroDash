const fs = require('fs');
const file = 'backend/src/routes/server/list.js';
let content = fs.readFileSync(file, 'utf8');

const target =   const base = (process.env.PTERO_BASE_URL || '').replace(/\\/$/, '');
  let deletedCount = 0;
  
    const enriched = await Promise.all(list.map(async (s) => {
        let status = s.status || 'unknown';
        let suspended = status === 'suspended';;

const replacement =   const base = (process.env.PTERO_BASE_URL || '').replace(/\\/$/, '');
  let deletedCount = 0;
  
    const panelPingData = await getCache('ping:panel');
    const isPanelDown = !panelPingData || panelPingData.ping === -1 || panelPingData.ping === null;
    const locationPingCache = {};

    const enriched = await Promise.all(list.map(async (s) => {
        let status = s.status || 'unknown';
        let suspended = status === 'suspended';
        
        let isNodeDown = false;
        if (s.locationId && s.locationId._id) {
          const locId = s.locationId._id.toString();
          if (locationPingCache[locId] === undefined) {
             const nodePing = await getCache(\ping:\\);
             locationPingCache[locId] = !nodePing || nodePing.ping === -1 || nodePing.ping === null;
          }
          isNodeDown = locationPingCache[locId];
        }

        const isUnreachable = isPanelDown || isNodeDown;;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  
  const target2 =           createdAt: s.createdAt || new Date(),
          suspended: suspended,
          unreachable: false
        };
    }));;
    
  const replacement2 =           createdAt: s.createdAt || new Date(),
          suspended: suspended,
          unreachable: isUnreachable
        };
    }));;
    
  if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    fs.writeFileSync(file, content);
    console.log("Success");
  } else {
    console.log("Failed target 2");
  }
} else {
  console.log("Failed target 1");
}
