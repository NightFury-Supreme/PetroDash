const fs = require('fs');
const path = require('path');

const translations = {
  'es': {
    "confirmingPayment": "Confirmando pago",
    "confirmingPaymentDesc": "Por favor espere mientras confirmamos su transacción de forma segura. No cierre esta ventana.",
    "paymentCompleted": "Pago completado",
    "paymentCompletedDesc": "Su plan ha sido activado. Será redirigido al panel en unos segundos.",
    "goToDashboard": "Ir al panel",
    "cancelled": "Cancelado",
    "paymentCancelledDesc": "Su pago no se completó. No se han realizado cargos a su cuenta.",
    "returnToShop": "Volver a la tienda",
    "processing": "Procesando...",
    "success": "Éxito"
  },
  'fr': {
    "confirmingPayment": "Confirmation du paiement",
    "confirmingPaymentDesc": "Veuillez patienter pendant que nous confirmons votre transaction en toute sécurité. Ne fermez pas cette fenêtre.",
    "paymentCompleted": "Paiement terminé",
    "paymentCompletedDesc": "Votre plan a été activé. Vous serez redirigé vers le tableau de bord dans quelques secondes.",
    "goToDashboard": "Aller au tableau de bord",
    "cancelled": "Annulé",
    "paymentCancelledDesc": "Votre paiement n'a pas abouti. Aucun frais n'a été facturé sur votre compte.",
    "returnToShop": "Retour à la boutique",
    "processing": "Traitement en cours...",
    "success": "Succès"
  },
  'de': {
    "confirmingPayment": "Zahlung wird bestätigt",
    "confirmingPaymentDesc": "Bitte warten Sie, während wir Ihre Transaktion sicher bestätigen. Schließen Sie dieses Fenster nicht.",
    "paymentCompleted": "Zahlung abgeschlossen",
    "paymentCompletedDesc": "Ihr Plan wurde aktiviert. Sie werden in wenigen Sekunden zum Dashboard weitergeleitet.",
    "goToDashboard": "Zum Dashboard gehen",
    "cancelled": "Abgebrochen",
    "paymentCancelledDesc": "Ihre Zahlung wurde nicht abgeschlossen. Es wurden keine Gebühren von Ihrem Konto abgebucht.",
    "returnToShop": "Zurück zum Shop",
    "processing": "Wird bearbeitet...",
    "success": "Erfolg"
  },
  'ar': {
    "confirmingPayment": "تأكيد الدفع",
    "confirmingPaymentDesc": "يرجى الانتظار بينما نقوم بتأكيد معاملتك بأمان. لا تغلق هذه النافذة.",
    "paymentCompleted": "اكتمل الدفع",
    "paymentCompletedDesc": "تم تفعيل خطتك. ستتم إعادة توجيهك إلى لوحة التحكم خلال ثوانٍ قليلة.",
    "goToDashboard": "الذهاب إلى لوحة التحكم",
    "cancelled": "تم الإلغاء",
    "paymentCancelledDesc": "لم يكتمل الدفع الخاص بك. لم يتم خصم أي رسوم من حسابك.",
    "returnToShop": "العودة إلى المتجر",
    "processing": "جاري المعالجة...",
    "success": "نجاح"
  },
  'hi': {
    "confirmingPayment": "भुगतान की पुष्टि हो रही है",
    "confirmingPaymentDesc": "कृपया प्रतीक्षा करें जब तक हम आपके लेन-देन की सुरक्षित पुष्टि करते हैं। इस विंडो को बंद न करें।",
    "paymentCompleted": "भुगतान पूर्ण हुआ",
    "paymentCompletedDesc": "आपकी योजना सक्रिय हो गई है। आपको कुछ ही सेकंड में डैशबोर्ड पर पुनर्निर्देशित किया जाएगा।",
    "goToDashboard": "डैशबोर्ड पर जाएं",
    "cancelled": "रद्द किया गया",
    "paymentCancelledDesc": "आपका भुगतान पूरा नहीं हुआ। आपके खाते से कोई शुल्क नहीं लिया गया है।",
    "returnToShop": "दुकान पर लौटें",
    "processing": "प्रोसेसिंग...",
    "success": "सफलता"
  },
  'en': {
    "processing": "Processing...",
    "success": "Success"
  }
};

const msgDir = path.join(__dirname, '../frontend/messages');
const files = fs.readdirSync(msgDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(msgDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (translations[lang]) {
    for (const [k, v] of Object.entries(translations[lang])) {
      data.Shop[k] = v;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
});
