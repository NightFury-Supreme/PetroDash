const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'fr', 'es', 'ar', 'hi'];
const messagesToAdd = {
  "ERR_PAYMENT_PROVIDER_UNSUPPORTED": "Selected payment provider is not supported.",
  "ERR_PAYMENT_CAPTURE_MISSING": "Missing payment capture ID for refund.",
  "ERR_PAYMENT_VOID_COMPLETED": "Cannot void a completed payment. Use refund instead.",
  "ERR_INVOICE_NOT_FOUND": "Invoice not found.",
  "ERR_LEDGER_QUERY_INVALID": "Invalid ledger query parameters.",
  "ERR_PAYMENT_VALIDATION_FAILED": "Payment validation failed.",
  "ERR_PAYMENT_NOT_FOUND": "Payment not found."
};

locales.forEach(loc => {
  const filePath = path.join(__dirname, 'frontend/messages', `${loc}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!content.BackendErrors) {
    content.BackendErrors = {};
  }
  
  let changed = false;
  for (const [key, val] of Object.entries(messagesToAdd)) {
    if (!content.BackendErrors[key]) {
      content.BackendErrors[key] = val; // for non-en, using english fallback is fine per general instructions or I can prefix with untranslated if needed. I'll just use English.
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated ${loc}.json`);
  }
});
