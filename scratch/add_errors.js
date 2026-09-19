const fs = require('fs');
const path = require('path');

const langs = ['en', 'hi', 'es', 'fr', 'de', 'ar'];

const translations = {
  en: {
    failedToLoadDashboardData: 'Failed to load dashboard data',
    failedToLoadData: 'Failed to load data',
    failedToCreateServer: 'Failed to create server',
    failedToLoadItems: 'Failed to load items',
    failedToLoadPlans: 'Failed to load plans',
    unknownError: 'Unknown error'
  },
  hi: {
    failedToLoadDashboardData: 'डैशबोर्ड डेटा लोड करने में विफल',
    failedToLoadData: 'डेटा लोड करने में विफल',
    failedToCreateServer: 'सर्वर बनाने में विफल',
    failedToLoadItems: 'आइटम लोड करने में विफल',
    failedToLoadPlans: 'प्लान लोड करने में विफल',
    unknownError: 'अज्ञात त्रुटि'
  },
  es: {
    failedToLoadDashboardData: 'Error al cargar los datos del panel',
    failedToLoadData: 'Error al cargar los datos',
    failedToCreateServer: 'Error al crear el servidor',
    failedToLoadItems: 'Error al cargar los artículos',
    failedToLoadPlans: 'Error al cargar los planes',
    unknownError: 'Error desconocido'
  },
  fr: {
    failedToLoadDashboardData: 'Échec du chargement des données du tableau de bord',
    failedToLoadData: 'Échec du chargement des données',
    failedToCreateServer: 'Échec de la création du serveur',
    failedToLoadItems: 'Échec du chargement des articles',
    failedToLoadPlans: 'Échec du chargement des plans',
    unknownError: 'Erreur inconnue'
  },
  de: {
    failedToLoadDashboardData: 'Dashboard-Daten konnten nicht geladen werden',
    failedToLoadData: 'Daten konnten nicht geladen werden',
    failedToCreateServer: 'Server konnte nicht erstellt werden',
    failedToLoadItems: 'Artikel konnten nicht geladen werden',
    failedToLoadPlans: 'Pläne konnten nicht geladen werden',
    unknownError: 'Unbekannter Fehler'
  },
  ar: {
    failedToLoadDashboardData: 'فشل تحميل بيانات لوحة القيادة',
    failedToLoadData: 'فشل تحميل البيانات',
    failedToCreateServer: 'فشل إنشاء الخادم',
    failedToLoadItems: 'فشل تحميل العناصر',
    failedToLoadPlans: 'فشل تحميل الخطط',
    unknownError: 'خطأ غير معروف'
  }
};

for (const lang of langs) {
  const filePath = path.join(__dirname, '../frontend/messages', lang + '.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.GlobalErrors) data.GlobalErrors = {};
    
    Object.assign(data.GlobalErrors, translations[lang]);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('Updated ' + lang + '.json');
  }
}
