const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../frontend/messages');
const files = ['en.json', 'hi.json', 'es.json', 'fr.json', 'de.json', 'ar.json'];

const translations = {
  en: {
    ERR_SERVER_NOT_FOUND: "The requested server could not be found.",
    ERR_SERVER_SUSPENDED: "Cannot complete operation because the server is suspended.",
    ERR_SERVER_CREATING: "Cannot complete operation because the server is currently being created.",
    ERR_SERVER_LOCKED: "Another server operation is in progress. Please wait a moment."
  },
  hi: {
    ERR_SERVER_NOT_FOUND: "अनुरोधित सर्वर नहीं मिला।",
    ERR_SERVER_SUSPENDED: "सर्वर निलंबित होने के कारण संचालन पूरा नहीं किया जा सकता।",
    ERR_SERVER_CREATING: "संचालन पूरा नहीं किया जा सकता क्योंकि सर्वर अभी बनाया जा रहा है।",
    ERR_SERVER_LOCKED: "एक अन्य सर्वर संचालन प्रगति पर है। कृपया प्रतीक्षा करें।"
  },
  es: {
    ERR_SERVER_NOT_FOUND: "No se pudo encontrar el servidor solicitado.",
    ERR_SERVER_SUSPENDED: "No se puede completar la operación porque el servidor está suspendido.",
    ERR_SERVER_CREATING: "No se puede completar la operación porque el servidor se está creando actualmente.",
    ERR_SERVER_LOCKED: "Otra operación del servidor está en progreso. Por favor espera un momento."
  },
  fr: {
    ERR_SERVER_NOT_FOUND: "Le serveur demandé est introuvable.",
    ERR_SERVER_SUSPENDED: "Impossible de terminer l'opération car le serveur est suspendu.",
    ERR_SERVER_CREATING: "Impossible de terminer l'opération car le serveur est en cours de création.",
    ERR_SERVER_LOCKED: "Une autre opération du serveur est en cours. Veuillez patienter."
  },
  de: {
    ERR_SERVER_NOT_FOUND: "Der angeforderte Server konnte nicht gefunden werden.",
    ERR_SERVER_SUSPENDED: "Vorgang kann nicht abgeschlossen werden, da der Server gesperrt ist.",
    ERR_SERVER_CREATING: "Vorgang kann nicht abgeschlossen werden, da der Server derzeit erstellt wird.",
    ERR_SERVER_LOCKED: "Ein weiterer Servervorgang ist im Gange. Bitte warten Sie einen Moment."
  },
  ar: {
    ERR_SERVER_NOT_FOUND: "تعذر العثور على الخادم المطلوب.",
    ERR_SERVER_SUSPENDED: "لا يمكن إكمال العملية لأن الخادم معلق.",
    ERR_SERVER_CREATING: "لا يمكن إكمال العملية لأن الخادم قيد الإنشاء حاليًا.",
    ERR_SERVER_LOCKED: "هناك عملية خادم أخرى قيد التقدم. يرجى الانتظار لحظة."
  }
};

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(messagesDir, file);
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.BackendErrors) {
      data.BackendErrors = {};
    }
    Object.assign(data.BackendErrors, translations[lang]);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file}`);
  }
});
