import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useI18n } from '@extension/i18n';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh_CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  const { t } = useI18n();

  const getCurrentLanguage = () => {
    if (!value || typeof value !== 'string') {
      return LANGUAGES[0].nativeName; // Default to English
    }
    const lang = LANGUAGES.find(l => value.startsWith(l.code));
    return lang?.nativeName || LANGUAGES[0].nativeName;
  };

  return (
    <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-4 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="bg-secondary rounded-lg p-2">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <div className="font-medium">Language / 语言 / 언어 / 言語 / Ngôn ngữ</div>
          <p className="text-muted-foreground text-xs">
            {t('appearance')} {/* Will be auto-detected */}
          </p>
        </div>
      </div>
      <Select value={value || 'en'} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>{getCurrentLanguage()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(lang => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.nativeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
