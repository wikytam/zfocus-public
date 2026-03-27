import en from '../../../website/messages/en.json';
import vi from '../../../website/messages/vi.json';
import ko from '../../../website/messages/ko.json';
import ja from '../../../website/messages/ja.json';
import zh from '../../../website/messages/zh.json';

type Messages = typeof en;
type Locale = 'en' | 'vi' | 'ko' | 'ja' | 'zh';

const messagesMap: Record<string, Messages> = { en, vi, ko, ja, zh };

const getMessages = (locale: Locale): Messages => messagesMap[locale] ?? en;

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? NestedKeyOf<T[K], `${Prefix}${K}.`> : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

type TranslationKey = NestedKeyOf<Messages>;

const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : path;
};

const createTranslator = (locale: Locale) => {
  const messages = getMessages(locale);
  return (key: string): string => getNestedValue(messages as unknown as Record<string, unknown>, key);
};

export { getMessages, createTranslator };
export type { Locale, Messages, TranslationKey };
