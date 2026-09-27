import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  if (!source) return target || {};
  if (!target) return source || {};
  const output: Record<string, any> = { ...target };
  
  for (const key of Object.keys(source)) {
    const sVal = source[key];
    const tVal = target[key];
    if (
      sVal &&
      typeof sVal === 'object' &&
      !Array.isArray(sVal) &&
      tVal &&
      typeof tVal === 'object' &&
      !Array.isArray(tVal)
    ) {
      output[key] = deepMerge(tVal, sVal);
    } else if (sVal !== undefined) {
      output[key] = sVal;
    }
  }
  return output;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const enMessages = (await import('../../messages/en.json')).default;
  let messages = enMessages;

  if (locale !== 'en') {
    try {
      const localeMessages = (await import(`../../messages/${locale}.json`)).default;
      messages = deepMerge(enMessages, localeMessages) as typeof enMessages;
    } catch {
      messages = enMessages;
    }
  }

  return {
    locale,
    now: new Date(),
    timeZone: 'UTC',
    messages: messages as typeof enMessages,
    onError(error) {
      if (error.code === 'MISSING_MESSAGE') {
        return;
      }
      console.error(error);
    },
    getMessageFallback({ key }) {
      const parts = key.split('.');
      return parts[parts.length - 1];
    },
  };
});
