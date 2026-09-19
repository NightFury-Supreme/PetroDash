const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/messages');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const updates = {
  en: {
    "closeTicket": "Close Ticket",
    "softDelete": "Soft Delete",
    "restore": "Restore"
  },
  hi: {
    "closeTicket": "टिकट बंद करें",
    "softDelete": "सॉफ्ट डिलीट",
    "restore": "पुनर्स्थापित करें"
  },
  es: {
    "closeTicket": "Cerrar ticket",
    "softDelete": "Eliminar suavemente",
    "restore": "Restaurar"
  },
  fr: {
    "closeTicket": "Fermer le ticket",
    "softDelete": "Suppression douce",
    "restore": "Restaurer"
  },
  de: {
    "closeTicket": "Ticket schließen",
    "softDelete": "Soft Delete",
    "restore": "Wiederherstellen"
  },
  ar: {
    "closeTicket": "إغلاق التذكرة",
    "softDelete": "حذف ناعم",
    "restore": "استعادة"
  }
};

for (const file of files) {
  const lang = path.basename(file, '.json');
  if (!updates[lang]) continue;
  
  const p = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  
  if (!data.Tickets) data.Tickets = {};
  
  data.Tickets = { ...data.Tickets, ...updates[lang] };
  
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}
console.log('CtxItem translations patched successfully.');
