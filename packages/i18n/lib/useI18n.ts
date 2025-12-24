// Import all message files
import enMessages from '../locales/en/messages.json' with { type: 'json' };
import jaMessages from '../locales/ja/messages.json' with { type: 'json' };
import koMessages from '../locales/ko/messages.json' with { type: 'json' };
import viMessages from '../locales/vi/messages.json' with { type: 'json' };
import zhMessages from '../locales/zh_CN/messages.json' with { type: 'json' };
import { useEffect, useState } from 'react';
import type { MessageKeyType } from './types.js';

const MESSAGES: Record<string, Record<string, { message: string }>> = {
  en: enMessages,
  en_US: enMessages,
  en_GB: enMessages,
  ko: koMessages,
  ko_KR: koMessages,
  zh_CN: zhMessages,
  zh: zhMessages,
  ja: jaMessages,
  ja_JP: jaMessages,
  vi: viMessages,
  vi_VN: viMessages,
};

export const useI18n = () => {
  const [locale, setLocale] = useState<string>('');

  useEffect(() => {
    // Get user's language preference from storage
    chrome.storage.sync.get('focus-settings', data => {
      const userLang = data['focus-settings']?.language;
      if (userLang) {
        setLocale(userLang);
      } else {
        // Fallback to browser language
        const browserLang = chrome.i18n.getUILanguage();
        setLocale(browserLang);
      }
    });

    // Listen for language changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['focus-settings']?.newValue?.language) {
        setLocale(changes['focus-settings'].newValue.language);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const t = (key: MessageKeyType, substitutions?: string | string[]) => {
    // Normalize locale (zh_CN, zh-CN, zh all map to zh_CN)
    const normalizedLocale = locale.replace('-', '_');
    const messages = MESSAGES[normalizedLocale] || MESSAGES[locale.split('_')[0]] || MESSAGES.en;

    const message = messages[key]?.message || key;

    // Handle substitutions if provided
    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      return subs.reduce(
        (msg, sub, i) => msg.replace(`$${i + 1}`, sub).replace(`$${String.fromCharCode(65 + i)}$`, sub),
        message,
      );
    }

    return message;
  };

  return {
    t,
    locale,
    language: locale.split(/[-_]/)[0], // Get language code without region
  };
};

// Helper function to get current locale from storage
export const getCurrentLocale = async (): Promise<string> => {
  const data = await chrome.storage.sync.get('focus-settings');
  return data['focus-settings']?.language || chrome.i18n.getUILanguage();
};

// Helper function to get language code
export const getLanguageCode = () => chrome.i18n.getUILanguage().split(/[-_]/)[0];
