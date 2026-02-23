import { routing } from './i18n/routing';
import { getRequestConfig } from 'next-intl/server';

// Preload messages (static)
const messagesMap: Record<string, Record<string, any>> = {
  vi: require('./messages/vi.json'),
  en: require('./messages/en.json'),
  ko: require('./messages/ko.json'),
  ja: require('./messages/ja.json'),
  zh: require('./messages/zh.json'),
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messagesMap[locale] || messagesMap[routing.defaultLocale],
  };
});
