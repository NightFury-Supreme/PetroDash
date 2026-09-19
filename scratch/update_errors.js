const fs = require('fs');
const path = require('path');

const errors = {
  notAuthenticated: 'Not authenticated',
  authenticationRequired: 'Authentication required',
  failed: 'Failed',
  failedToLoadUsageData: 'Failed to load usage data',
  failedToLoadUserResources: 'Failed to load user resources',
  failedToLoadServers: 'Failed to load servers',
  failedToLoadEarnInfo: 'Failed to load earn info',
  failedToStart: 'Failed to start',
  failedToLoadPanelInformation: 'Failed to load panel information',
  failedToResetPassword: 'Failed to reset password',
  failedToLoadProfile: 'Failed to load profile',
  failedToUpdateProfilePicture: 'Failed to update profile picture',
  failedToRevokeSession: 'Failed to revoke session',
  failedToSendVerificationEmail: 'Failed to send verification email',
  failedToVerifyCode: 'Failed to verify code',
  failedToLoadTickets: 'Failed to load tickets',
  serverNotFound: 'Server not found',
  updateFailed: 'Update failed',
  failedToLoadCreationData: 'Failed to load creation data',
  validationFixRequired: 'Please fix the validation errors before saving',
  resourceLimitsExceeded: 'Resource limits exceeded. Please check the validation errors below.',
  statusFetchFailed: 'Status fetch failed'
};

const translations = {
  en: errors,
  hi: {
    notAuthenticated: 'प्रमाणीकृत नहीं है',
    authenticationRequired: 'प्रमाणीकरण आवश्यक है',
    failed: 'विफल',
    failedToLoadUsageData: 'उपयोग डेटा लोड करने में विफल',
    failedToLoadUserResources: 'उपयोगकर्ता संसाधन लोड करने में विफल',
    failedToLoadServers: 'सर्वर लोड करने में विफल',
    failedToLoadEarnInfo: 'कमाई की जानकारी लोड करने में विफल',
    failedToStart: 'शुरू करने में विफल',
    failedToLoadPanelInformation: 'पैनल जानकारी लोड करने में विफल',
    failedToResetPassword: 'पासवर्ड रीसेट करने में विफल',
    failedToLoadProfile: 'प्रोफ़ाइल लोड करने में विफल',
    failedToUpdateProfilePicture: 'प्रोफ़ाइल चित्र अपडेट करने में विफल',
    failedToRevokeSession: 'सत्र रद्द करने में विफल',
    failedToSendVerificationEmail: 'सत्यापन ईमेल भेजने में विफल',
    failedToVerifyCode: 'कोड सत्यापित करने में विफल',
    failedToLoadTickets: 'टिकट लोड करने में विफल',
    serverNotFound: 'सर्वर नहीं मिला',
    updateFailed: 'अपडेट विफल',
    failedToLoadCreationData: 'निर्माण डेटा लोड करने में विफल',
    validationFixRequired: 'कृपया सहेजने से पहले सत्यापन त्रुटियों को ठीक करें',
    resourceLimitsExceeded: 'संसाधन सीमा पार हो गई। कृपया नीचे सत्यापन त्रुटियों की जांच करें।',
    statusFetchFailed: 'स्थिति लाने में विफल'
  },
  es: {
    notAuthenticated: 'No autenticado',
    authenticationRequired: 'Autenticación requerida',
    failed: 'Falló',
    failedToLoadUsageData: 'Error al cargar los datos de uso',
    failedToLoadUserResources: 'Error al cargar los recursos del usuario',
    failedToLoadServers: 'Error al cargar los servidores',
    failedToLoadEarnInfo: 'Error al cargar la información de ganancias',
    failedToStart: 'Error al iniciar',
    failedToLoadPanelInformation: 'Error al cargar la información del panel',
    failedToResetPassword: 'Error al restablecer la contraseña',
    failedToLoadProfile: 'Error al cargar el perfil',
    failedToUpdateProfilePicture: 'Error al actualizar la foto de perfil',
    failedToRevokeSession: 'Error al revocar la sesión',
    failedToSendVerificationEmail: 'Error al enviar el correo de verificación',
    failedToVerifyCode: 'Error al verificar el código',
    failedToLoadTickets: 'Error al cargar los tickets',
    serverNotFound: 'Servidor no encontrado',
    updateFailed: 'Error al actualizar',
    failedToLoadCreationData: 'Error al cargar los datos de creación',
    validationFixRequired: 'Solucione los errores de validación antes de guardar',
    resourceLimitsExceeded: 'Límites de recursos excedidos. Verifique los errores a continuación.',
    statusFetchFailed: 'Error al obtener el estado'
  },
  fr: {
    notAuthenticated: 'Non authentifié',
    authenticationRequired: 'Authentification requise',
    failed: 'Échoué',
    failedToLoadUsageData: 'Échec du chargement des données',
    failedToLoadUserResources: 'Échec du chargement des ressources',
    failedToLoadServers: 'Échec du chargement des serveurs',
    failedToLoadEarnInfo: 'Échec du chargement des informations',
    failedToStart: 'Échec du démarrage',
    failedToLoadPanelInformation: 'Échec du chargement des informations',
    failedToResetPassword: 'Échec de la réinitialisation',
    failedToLoadProfile: 'Échec du chargement du profil',
    failedToUpdateProfilePicture: 'Échec de la mise à jour de la photo',
    failedToRevokeSession: 'Échec de la révocation',
    failedToSendVerificationEmail: 'Échec de l\'envoi de l\'email',
    failedToVerifyCode: 'Échec de la vérification',
    failedToLoadTickets: 'Échec du chargement des tickets',
    serverNotFound: 'Serveur introuvable',
    updateFailed: 'Mise à jour échouée',
    failedToLoadCreationData: 'Échec du chargement des données',
    validationFixRequired: 'Veuillez corriger les erreurs avant d\'enregistrer',
    resourceLimitsExceeded: 'Limites dépassées. Vérifiez les erreurs.',
    statusFetchFailed: 'Échec de la récupération du statut'
  },
  de: {
    notAuthenticated: 'Nicht authentifiziert',
    authenticationRequired: 'Authentifizierung erforderlich',
    failed: 'Fehlgeschlagen',
    failedToLoadUsageData: 'Nutzungsdaten konnten nicht geladen werden',
    failedToLoadUserResources: 'Ressourcen konnten nicht geladen werden',
    failedToLoadServers: 'Server konnten nicht geladen werden',
    failedToLoadEarnInfo: 'Informationen konnten nicht geladen werden',
    failedToStart: 'Start fehlgeschlagen',
    failedToLoadPanelInformation: 'Panel-Informationen konnten nicht geladen werden',
    failedToResetPassword: 'Passwort konnte nicht zurückgesetzt werden',
    failedToLoadProfile: 'Profil konnte nicht geladen werden',
    failedToUpdateProfilePicture: 'Profilbild konnte nicht aktualisiert werden',
    failedToRevokeSession: 'Sitzung konnte nicht widerrufen werden',
    failedToSendVerificationEmail: 'Bestätigungs-E-Mail konnte nicht gesendet werden',
    failedToVerifyCode: 'Code konnte nicht verifiziert werden',
    failedToLoadTickets: 'Tickets konnten nicht geladen werden',
    serverNotFound: 'Server nicht gefunden',
    updateFailed: 'Aktualisierung fehlgeschlagen',
    failedToLoadCreationData: 'Erstellungsdaten konnten nicht geladen werden',
    validationFixRequired: 'Bitte beheben Sie die Validierungsfehler',
    resourceLimitsExceeded: 'Ressourcenlimits überschritten. Bitte überprüfen Sie die Fehler.',
    statusFetchFailed: 'Statusabruf fehlgeschlagen'
  },
  ar: {
    notAuthenticated: 'غير مصادق عليه',
    authenticationRequired: 'المصادقة مطلوبة',
    failed: 'فشل',
    failedToLoadUsageData: 'فشل تحميل بيانات الاستخدام',
    failedToLoadUserResources: 'فشل تحميل موارد المستخدم',
    failedToLoadServers: 'فشل تحميل الخوادم',
    failedToLoadEarnInfo: 'فشل تحميل المعلومات',
    failedToStart: 'فشل البدء',
    failedToLoadPanelInformation: 'فشل تحميل معلومات اللوحة',
    failedToResetPassword: 'فشل إعادة تعيين كلمة المرور',
    failedToLoadProfile: 'فشل تحميل الملف الشخصي',
    failedToUpdateProfilePicture: 'فشل تحديث صورة الملف الشخصي',
    failedToRevokeSession: 'فشل إبطال الجلسة',
    failedToSendVerificationEmail: 'فشل إرسال البريد الإلكتروني',
    failedToVerifyCode: 'فشل التحقق من الكود',
    failedToLoadTickets: 'فشل تحميل التذاكر',
    serverNotFound: 'الخادم غير موجود',
    updateFailed: 'فشل التحديث',
    failedToLoadCreationData: 'فشل تحميل بيانات الإنشاء',
    validationFixRequired: 'يرجى إصلاح أخطاء التحقق قبل الحفظ',
    resourceLimitsExceeded: 'تم تجاوز حدود الموارد. يرجى التحقق من الأخطاء.',
    statusFetchFailed: 'فشل جلب الحالة'
  }
};

const langs = ['en', 'hi', 'es', 'fr', 'de', 'ar'];

for (const lang of langs) {
  const filePath = path.join(__dirname, '../frontend/messages', lang + '.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.GlobalErrors = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('Updated ' + lang + '.json');
  }
}
