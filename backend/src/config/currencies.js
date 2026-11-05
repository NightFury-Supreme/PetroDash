const PAYPAL_SUPPORTED_CURRENCIES = new Set([
  'AUD',
  'BRL',
  'CAD',
  'CNY',
  'CZK',
  'DKK',
  'EUR',
  'HKD',
  'HUF',
  'ILS',
  'JPY',
  'MYR',
  'MXN',
  'TWD',
  'NZD',
  'NOK',
  'PHP',
  'PLN',
  'GBP',
  'SGD',
  'SEK',
  'CHF',
  'THB',
  'USD',
]);

const ZERO_DECIMAL_CURRENCIES = new Set(['HUF', 'JPY', 'TWD']);

const DEFAULT_CURRENCY = 'USD';

function isPayPalSupported(currency) {
  if (!currency || typeof currency !== 'string') return false;
  return PAYPAL_SUPPORTED_CURRENCIES.has(currency.toUpperCase().trim());
}

function formatCurrencyAmount(amount, currency = DEFAULT_CURRENCY) {
  const curr = String(currency || DEFAULT_CURRENCY).toUpperCase().trim();
  const num = Number(amount) || 0;
  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    return Math.round(num).toString();
  }
  return num.toFixed(2);
}

module.exports = {
  PAYPAL_SUPPORTED_CURRENCIES,
  ZERO_DECIMAL_CURRENCIES,
  DEFAULT_CURRENCY,
  isPayPalSupported,
  formatCurrencyAmount,
};
