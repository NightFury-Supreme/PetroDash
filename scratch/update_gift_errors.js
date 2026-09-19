const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../frontend/messages');
const files = ['en.json', 'hi.json', 'es.json', 'fr.json', 'de.json', 'ar.json'];

const translations = {
  en: {
    ERR_INVALID_PAYLOAD: "Invalid payload provided",
    ERR_TOO_MANY_ACTIVE_CODES: "Too many active codes",
    ERR_INSUFFICIENT_COINS: "Insufficient coins to create this gift",
    ERR_INVALID_QUERY_PARAMS: "Invalid query parameters provided",
    ERR_INVALID_CODE_FORMAT: "Invalid code format",
    ERR_GIFT_INVALID: "The gift code you entered is invalid or disabled.",
    ERR_GIFT_NOT_ACTIVE: "This gift code is not active yet.",
    ERR_GIFT_EXPIRED: "This gift code has expired.",
    ERR_GIFT_LIMIT_REACHED: "This gift code has reached its maximum redemption limit.",
    ERR_GIFT_ALREADY_REDEEMED: "You have already redeemed this gift code."
  },
  hi: {
    ERR_INVALID_PAYLOAD: "प्रदान किया गया पेलोड अमान्य है",
    ERR_TOO_MANY_ACTIVE_CODES: "बहुत सारे सक्रिय कोड हैं",
    ERR_INSUFFICIENT_COINS: "इस उपहार को बनाने के लिए अपर्याप्त सिक्के हैं",
    ERR_INVALID_QUERY_PARAMS: "प्रदान किए गए अमान्य क्वेरी पैरामीटर",
    ERR_INVALID_CODE_FORMAT: "अमान्य कोड प्रारूप",
    ERR_GIFT_INVALID: "आपके द्वारा दर्ज किया गया उपहार कोड अमान्य या अक्षम है।",
    ERR_GIFT_NOT_ACTIVE: "यह उपहार कोड अभी तक सक्रिय नहीं है।",
    ERR_GIFT_EXPIRED: "यह उपहार कोड समाप्त हो गया है।",
    ERR_GIFT_LIMIT_REACHED: "यह उपहार कोड अपनी अधिकतम मोचन सीमा तक पहुंच गया है।",
    ERR_GIFT_ALREADY_REDEEMED: "आप पहले ही इस उपहार कोड को भुना चुके हैं।"
  },
  es: {
    ERR_INVALID_PAYLOAD: "Carga útil no válida proporcionada",
    ERR_TOO_MANY_ACTIVE_CODES: "Demasiados códigos activos",
    ERR_INSUFFICIENT_COINS: "Monedas insuficientes para crear este regalo",
    ERR_INVALID_QUERY_PARAMS: "Parámetros de consulta no válidos proporcionados",
    ERR_INVALID_CODE_FORMAT: "Formato de código no válido",
    ERR_GIFT_INVALID: "El código de regalo que ingresaste es inválido o está deshabilitado.",
    ERR_GIFT_NOT_ACTIVE: "Este código de regalo aún no está activo.",
    ERR_GIFT_EXPIRED: "Este código de regalo ha caducado.",
    ERR_GIFT_LIMIT_REACHED: "Este código de regalo ha alcanzado su límite máximo de canje.",
    ERR_GIFT_ALREADY_REDEEMED: "Ya has canjeado este código de regalo."
  },
  fr: {
    ERR_INVALID_PAYLOAD: "Charge utile non valide fournie",
    ERR_TOO_MANY_ACTIVE_CODES: "Trop de codes actifs",
    ERR_INSUFFICIENT_COINS: "Pièces insuffisantes pour créer ce cadeau",
    ERR_INVALID_QUERY_PARAMS: "Paramètres de requête non valides fournis",
    ERR_INVALID_CODE_FORMAT: "Format de code non valide",
    ERR_GIFT_INVALID: "Le code cadeau que vous avez saisi est invalide ou désactivé.",
    ERR_GIFT_NOT_ACTIVE: "Ce code cadeau n'est pas encore actif.",
    ERR_GIFT_EXPIRED: "Ce code cadeau a expiré.",
    ERR_GIFT_LIMIT_REACHED: "Ce code cadeau a atteint sa limite maximale d'échange.",
    ERR_GIFT_ALREADY_REDEEMED: "Vous avez déjà échangé ce code cadeau."
  },
  de: {
    ERR_INVALID_PAYLOAD: "Ungültige Nutzlast bereitgestellt",
    ERR_TOO_MANY_ACTIVE_CODES: "Zu viele aktive Codes",
    ERR_INSUFFICIENT_COINS: "Unzureichende Münzen, um dieses Geschenk zu erstellen",
    ERR_INVALID_QUERY_PARAMS: "Ungültige Abfrageparameter bereitgestellt",
    ERR_INVALID_CODE_FORMAT: "Ungültiges Code-Format",
    ERR_GIFT_INVALID: "Der eingegebene Geschenkcode ist ungültig oder deaktiviert.",
    ERR_GIFT_NOT_ACTIVE: "Dieser Geschenkcode ist noch nicht aktiv.",
    ERR_GIFT_EXPIRED: "Dieser Geschenkcode ist abgelaufen.",
    ERR_GIFT_LIMIT_REACHED: "Dieser Geschenkcode hat sein maximales Einlösungslimit erreicht.",
    ERR_GIFT_ALREADY_REDEEMED: "Sie haben diesen Geschenkcode bereits eingelöst."
  },
  ar: {
    ERR_INVALID_PAYLOAD: "تم توفير حمولة غير صالحة",
    ERR_TOO_MANY_ACTIVE_CODES: "عدد كبير جدًا من الرموز النشطة",
    ERR_INSUFFICIENT_COINS: "عملات غير كافية لإنشاء هذه الهدية",
    ERR_INVALID_QUERY_PARAMS: "تم توفير معلمات استعلام غير صالحة",
    ERR_INVALID_CODE_FORMAT: "تنسيق الرمز غير صالح",
    ERR_GIFT_INVALID: "رمز الهدية الذي أدخلته غير صالح أو معطل.",
    ERR_GIFT_NOT_ACTIVE: "رمز الهدية هذا ليس نشطًا بعد.",
    ERR_GIFT_EXPIRED: "لقد انتهت صلاحية رمز الهدية هذا.",
    ERR_GIFT_LIMIT_REACHED: "لقد وصل رمز الهدية هذا إلى الحد الأقصى للاسترداد.",
    ERR_GIFT_ALREADY_REDEEMED: "لقد قمت بالفعل باسترداد رمز الهدية هذا."
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
