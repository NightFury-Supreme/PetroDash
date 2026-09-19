const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/messages');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const updates = {
  en: {
    "sortTitle": "Sort",
    "sortUpdatedNewest": "Updated - Newest",
    "sortUpdatedOldest": "Updated - Oldest",
    "sortCreatedNewest": "Created - Newest",
    "sortCreatedOldest": "Created - Oldest",
    "sortPriorityHigh": "Priority - High first",
    "sortPriorityLow": "Priority - Low first"
  },
  hi: {
    "sortTitle": "क्रमबद्ध करें",
    "sortUpdatedNewest": "अद्यतित - नवीनतम",
    "sortUpdatedOldest": "अद्यतित - सबसे पुराना",
    "sortCreatedNewest": "निर्मित - नवीनतम",
    "sortCreatedOldest": "निर्मित - सबसे पुराना",
    "sortPriorityHigh": "प्राथमिकता - उच्च पहले",
    "sortPriorityLow": "प्राथमिकता - निम्न पहले"
  },
  es: {
    "sortTitle": "Ordenar",
    "sortUpdatedNewest": "Actualizado - Más reciente",
    "sortUpdatedOldest": "Actualizado - Más antiguo",
    "sortCreatedNewest": "Creado - Más reciente",
    "sortCreatedOldest": "Creado - Más antiguo",
    "sortPriorityHigh": "Prioridad - Alta primero",
    "sortPriorityLow": "Prioridad - Baja primero"
  },
  fr: {
    "sortTitle": "Trier",
    "sortUpdatedNewest": "Mis à jour - Plus récent",
    "sortUpdatedOldest": "Mis à jour - Plus ancien",
    "sortCreatedNewest": "Créé - Plus récent",
    "sortCreatedOldest": "Créé - Plus ancien",
    "sortPriorityHigh": "Priorité - Haute en premier",
    "sortPriorityLow": "Priorité - Basse en premier"
  },
  de: {
    "sortTitle": "Sortieren",
    "sortUpdatedNewest": "Aktualisiert - Neueste",
    "sortUpdatedOldest": "Aktualisiert - Älteste",
    "sortCreatedNewest": "Erstellt - Neueste",
    "sortCreatedOldest": "Erstellt - Älteste",
    "sortPriorityHigh": "Priorität - Hoch zuerst",
    "sortPriorityLow": "Priorität - Niedrig zuerst"
  },
  ar: {
    "sortTitle": "ترتيب",
    "sortUpdatedNewest": "تم التحديث - الأحدث",
    "sortUpdatedOldest": "تم التحديث - الأقدم",
    "sortCreatedNewest": "تم الإنشاء - الأحدث",
    "sortCreatedOldest": "تم الإنشاء - الأقدم",
    "sortPriorityHigh": "الأولوية - عالية أولاً",
    "sortPriorityLow": "الأولوية - منخفضة أولاً"
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
console.log('Sort translations patched successfully.');
