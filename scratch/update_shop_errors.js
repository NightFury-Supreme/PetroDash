const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../frontend/messages');
const files = ['en.json', 'hi.json', 'es.json', 'fr.json', 'de.json', 'ar.json'];

const translations = {
  en: {
    ERR_SHOP_INVALID_ITEM: "Invalid shop item selected.",
    ERR_SHOP_ITEM_NOT_FOUND: "The requested shop item could not be found.",
    ERR_SHOP_MAX_PER_PURCHASE: "Maximum purchase limit exceeded for this item.",
    ERR_SHOP_INSUFFICIENT_COINS: "You do not have enough coins to complete this purchase."
  },
  hi: {
    ERR_SHOP_INVALID_ITEM: "अमान्य दुकान आइटम चुना गया।",
    ERR_SHOP_ITEM_NOT_FOUND: "अनुरोधित दुकान आइटम नहीं मिला।",
    ERR_SHOP_MAX_PER_PURCHASE: "इस आइटम के लिए अधिकतम खरीद सीमा पार हो गई।",
    ERR_SHOP_INSUFFICIENT_COINS: "इस खरीद को पूरा करने के लिए आपके पास पर्याप्त सिक्के नहीं हैं।"
  },
  es: {
    ERR_SHOP_INVALID_ITEM: "Artículo de tienda no válido seleccionado.",
    ERR_SHOP_ITEM_NOT_FOUND: "No se pudo encontrar el artículo de tienda solicitado.",
    ERR_SHOP_MAX_PER_PURCHASE: "Se excedió el límite máximo de compra para este artículo.",
    ERR_SHOP_INSUFFICIENT_COINS: "No tienes suficientes monedas para completar esta compra."
  },
  fr: {
    ERR_SHOP_INVALID_ITEM: "Article de boutique non valide sélectionné.",
    ERR_SHOP_ITEM_NOT_FOUND: "L'article de boutique demandé est introuvable.",
    ERR_SHOP_MAX_PER_PURCHASE: "Limite d'achat maximale dépassée pour cet article.",
    ERR_SHOP_INSUFFICIENT_COINS: "Vous n'avez pas assez de pièces pour effectuer cet achat."
  },
  de: {
    ERR_SHOP_INVALID_ITEM: "Ungültiger Shop-Artikel ausgewählt.",
    ERR_SHOP_ITEM_NOT_FOUND: "Der angeforderte Shop-Artikel konnte nicht gefunden werden.",
    ERR_SHOP_MAX_PER_PURCHASE: "Maximale Kauflimit für diesen Artikel überschritten.",
    ERR_SHOP_INSUFFICIENT_COINS: "Sie haben nicht genug Münzen, um diesen Kauf abzuschließen."
  },
  ar: {
    ERR_SHOP_INVALID_ITEM: "تم تحديد عنصر متجر غير صالح.",
    ERR_SHOP_ITEM_NOT_FOUND: "تعذر العثور على عنصر المتجر المطلوب.",
    ERR_SHOP_MAX_PER_PURCHASE: "تم تجاوز الحد الأقصى للشراء لهذا العنصر.",
    ERR_SHOP_INSUFFICIENT_COINS: "ليس لديك عملات كافية لإتمام عملية الشراء هذه."
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
