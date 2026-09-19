const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../frontend/messages');
const files = ['en.json', 'hi.json', 'es.json', 'fr.json', 'de.json', 'ar.json'];

const translations = {
  en: {
    Banned: {
      title: "Account Banned",
      subtitle: "You cannot access the service at this time.",
      reasonLabel: "Reason:",
      statusLabel: "Status:",
      bannedUntil: "Banned until {date}",
      lifetimeBan: "Lifetime ban",
      contactSupport: "If you believe this is a mistake, please contact support."
    },
    Auth_verify_subtitleCard: "Secure your account"
  },
  hi: {
    Banned: {
      title: "खाता प्रतिबंधित",
      subtitle: "आप इस समय सेवा तक नहीं पहुंच सकते हैं।",
      reasonLabel: "कारण:",
      statusLabel: "स्थिति:",
      bannedUntil: "{date} तक प्रतिबंधित",
      lifetimeBan: "आजीवन प्रतिबंध",
      contactSupport: "यदि आपको लगता है कि यह एक गलती है, तो कृपया समर्थन से संपर्क करें।"
    },
    Auth_verify_subtitleCard: "अपना खाता सुरक्षित करें"
  },
  es: {
    Banned: {
      title: "Cuenta Prohibida",
      subtitle: "No puedes acceder al servicio en este momento.",
      reasonLabel: "Motivo:",
      statusLabel: "Estado:",
      bannedUntil: "Prohibido hasta {date}",
      lifetimeBan: "Prohibición de por vida",
      contactSupport: "Si crees que esto es un error, por favor contacta al soporte."
    },
    Auth_verify_subtitleCard: "Asegura tu cuenta"
  },
  fr: {
    Banned: {
      title: "Compte Banni",
      subtitle: "Vous ne pouvez pas accéder au service pour le moment.",
      reasonLabel: "Raison :",
      statusLabel: "Statut :",
      bannedUntil: "Banni jusqu'au {date}",
      lifetimeBan: "Bannissement à vie",
      contactSupport: "Si vous pensez que c'est une erreur, veuillez contacter le support."
    },
    Auth_verify_subtitleCard: "Sécurisez votre compte"
  },
  de: {
    Banned: {
      title: "Konto Gesperrt",
      subtitle: "Sie können derzeit nicht auf den Dienst zugreifen.",
      reasonLabel: "Grund:",
      statusLabel: "Status:",
      bannedUntil: "Gesperrt bis {date}",
      lifetimeBan: "Lebenslange Sperre",
      contactSupport: "Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie bitte den Support."
    },
    Auth_verify_subtitleCard: "Sichern Sie Ihr Konto"
  },
  ar: {
    Banned: {
      title: "تم حظر الحساب",
      subtitle: "لا يمكنك الوصول إلى الخدمة في هذا الوقت.",
      reasonLabel: "السبب:",
      statusLabel: "الحالة:",
      bannedUntil: "محظور حتى {date}",
      lifetimeBan: "حظر مدى الحياة",
      contactSupport: "إذا كنت تعتقد أن هذا خطأ، يرجى الاتصال بالدعم."
    },
    Auth_verify_subtitleCard: "تأمين حسابك"
  }
};

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(messagesDir, file);
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Add Banned namespace
    if (!data.Banned) {
      data.Banned = {};
    }
    Object.assign(data.Banned, translations[lang].Banned);
    
    // Add Auth.verify subtitleCard
    if (data.Auth && data.Auth.verify) {
      data.Auth.verify.subtitleCard = translations[lang].Auth_verify_subtitleCard;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file}`);
  }
});
