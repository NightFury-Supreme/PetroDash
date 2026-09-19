const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../frontend/messages');
const files = ['en.json', 'hi.json', 'es.json', 'fr.json', 'de.json', 'ar.json'];

const translations = {
  en: {
    ERR_INVALID_QUERY_PARAMS: "Invalid query parameters provided",
    ERR_INVALID_PAYLOAD: "Invalid payload provided",
    ERR_NOT_ELIGIBLE: "Not eligible to set custom code",
    ERR_CODE_IN_USE: "Code already in use"
  },
  hi: {
    ERR_INVALID_QUERY_PARAMS: "प्रदान किए गए अमान्य क्वेरी पैरामीटर",
    ERR_INVALID_PAYLOAD: "प्रदान किया गया पेलोड अमान्य है",
    ERR_NOT_ELIGIBLE: "कस्टम कोड सेट करने के योग्य नहीं",
    ERR_CODE_IN_USE: "कोड पहले से उपयोग में है"
  },
  es: {
    ERR_INVALID_QUERY_PARAMS: "Parámetros de consulta no válidos proporcionados",
    ERR_INVALID_PAYLOAD: "Carga útil no válida proporcionada",
    ERR_NOT_ELIGIBLE: "No elegible para establecer código personalizado",
    ERR_CODE_IN_USE: "Código ya en uso"
  },
  fr: {
    ERR_INVALID_QUERY_PARAMS: "Paramètres de requête non valides fournis",
    ERR_INVALID_PAYLOAD: "Charge utile non valide fournie",
    ERR_NOT_ELIGIBLE: "Non éligible pour définir un code personnalisé",
    ERR_CODE_IN_USE: "Code déjà utilisé"
  },
  de: {
    ERR_INVALID_QUERY_PARAMS: "Ungültige Abfrageparameter bereitgestellt",
    ERR_INVALID_PAYLOAD: "Ungültige Nutzlast bereitgestellt",
    ERR_NOT_ELIGIBLE: "Nicht berechtigt, benutzerdefinierten Code festzulegen",
    ERR_CODE_IN_USE: "Code bereits in Gebrauch"
  },
  ar: {
    ERR_INVALID_QUERY_PARAMS: "تم توفير معلمات استعلام غير صالحة",
    ERR_INVALID_PAYLOAD: "تم توفير حمولة غير صالحة",
    ERR_NOT_ELIGIBLE: "غير مؤهل لتعيين رمز مخصص",
    ERR_CODE_IN_USE: "الرمز قيد الاستخدام بالفعل"
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
