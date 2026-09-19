const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../frontend/messages');
const files = ['en.json', 'hi.json', 'es.json', 'fr.json', 'de.json', 'ar.json'];

const translations = {
  en: "Internal Server Error",
  hi: "आंतरिक सर्वर त्रुटि",
  es: "Error de servidor interno",
  fr: "Erreur de serveur interne",
  de: "Interner Serverfehler",
  ar: "خطأ في الخادم الداخلي"
};

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(messagesDir, file);
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.Panel) {
      data.Panel.internalServerError = translations[lang];
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file}`);
  }
});
