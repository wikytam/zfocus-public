import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'vi', 'ko', 'ja', 'zh'],
  defaultLocale: 'en',
});
