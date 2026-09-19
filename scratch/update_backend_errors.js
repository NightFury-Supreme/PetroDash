const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../frontend/messages');
const files = ['en.json', 'hi.json', 'es.json', 'fr.json', 'de.json', 'ar.json'];

const translations = {
  en: {
    ERR_INTERNAL_SERVER: "Internal Server Error",
    ERR_USER_NOT_FOUND: "User not found",
    ERR_PROVISIONING_PENDING: "Account Provisioning Pending",
    ERR_PANEL_CONFIG: "Panel configuration error",
    ERR_PANEL_USER_NOT_FOUND: "Panel user not found",
    ERR_PANEL_ACCESS_DENIED: "Panel access denied",
    ERR_PANEL_INVALID_PASSWORD: "Invalid password format",
    ERR_NETWORK: "Network Error"
  },
  hi: {
    ERR_INTERNAL_SERVER: "आंतरिक सर्वर त्रुटि",
    ERR_USER_NOT_FOUND: "उपयोगकर्ता नहीं मिला",
    ERR_PROVISIONING_PENDING: "खाता प्रावधान लंबित है",
    ERR_PANEL_CONFIG: "पैनल कॉन्फ़िगरेशन त्रुटि",
    ERR_PANEL_USER_NOT_FOUND: "पैनल उपयोगकर्ता नहीं मिला",
    ERR_PANEL_ACCESS_DENIED: "पैनल पहुँच अस्वीकृत",
    ERR_PANEL_INVALID_PASSWORD: "अमान्य पासवर्ड प्रारूप",
    ERR_NETWORK: "नेटवर्क त्रुटि"
  },
  es: {
    ERR_INTERNAL_SERVER: "Error de servidor interno",
    ERR_USER_NOT_FOUND: "Usuario no encontrado",
    ERR_PROVISIONING_PENDING: "Aprovisionamiento de cuenta pendiente",
    ERR_PANEL_CONFIG: "Error de configuración del panel",
    ERR_PANEL_USER_NOT_FOUND: "Usuario del panel no encontrado",
    ERR_PANEL_ACCESS_DENIED: "Acceso al panel denegado",
    ERR_PANEL_INVALID_PASSWORD: "Formato de contraseña inválido",
    ERR_NETWORK: "Error de red"
  },
  fr: {
    ERR_INTERNAL_SERVER: "Erreur de serveur interne",
    ERR_USER_NOT_FOUND: "Utilisateur introuvable",
    ERR_PROVISIONING_PENDING: "Approvisionnement du compte en attente",
    ERR_PANEL_CONFIG: "Erreur de configuration du panneau",
    ERR_PANEL_USER_NOT_FOUND: "Utilisateur du panneau introuvable",
    ERR_PANEL_ACCESS_DENIED: "Accès au panneau refusé",
    ERR_PANEL_INVALID_PASSWORD: "Format de mot de passe invalide",
    ERR_NETWORK: "Erreur réseau"
  },
  de: {
    ERR_INTERNAL_SERVER: "Interner Serverfehler",
    ERR_USER_NOT_FOUND: "Benutzer nicht gefunden",
    ERR_PROVISIONING_PENDING: "Kontobereitstellung ausstehend",
    ERR_PANEL_CONFIG: "Panel-Konfigurationsfehler",
    ERR_PANEL_USER_NOT_FOUND: "Panel-Benutzer nicht gefunden",
    ERR_PANEL_ACCESS_DENIED: "Panel-Zugriff verweigert",
    ERR_PANEL_INVALID_PASSWORD: "Ungültiges Passwortformat",
    ERR_NETWORK: "Netzwerkfehler"
  },
  ar: {
    ERR_INTERNAL_SERVER: "خطأ في الخادم الداخلي",
    ERR_USER_NOT_FOUND: "المستخدم غير موجود",
    ERR_PROVISIONING_PENDING: "تجهيز الحساب قيد الانتظار",
    ERR_PANEL_CONFIG: "خطأ في تكوين اللوحة",
    ERR_PANEL_USER_NOT_FOUND: "مستخدم اللوحة غير موجود",
    ERR_PANEL_ACCESS_DENIED: "تم رفض الوصول إلى اللوحة",
    ERR_PANEL_INVALID_PASSWORD: "تنسيق كلمة المرور غير صالح",
    ERR_NETWORK: "خطأ في الشبكة"
  }
};

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(messagesDir, file);
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.BackendErrors = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file}`);
  }
});
