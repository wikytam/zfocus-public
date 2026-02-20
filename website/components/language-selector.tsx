'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import languages from '@/data/languages.json';
import { Globe, Check } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';

export const LanguageSelector = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const selectedLanguage = languages.find(lang => lang.code === locale);

  const handleLanguageChange = (newLocale: string) => {
    startTransition(() => {
      const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
      router.push(newPath);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-border bg-card/80 hover:bg-secondary h-9 gap-2 rounded-full px-3.5 font-medium"
          disabled={isPending}>
          <Globe className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-foreground hidden text-sm sm:inline">{selectedLanguage?.nativeName}</span>
          <span className="sm:hidden">{selectedLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-border bg-card w-48 rounded-xl shadow-lg">
        {languages.map(language => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex cursor-pointer items-center justify-between rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">{language.flag}</span>
              <span className="text-foreground">{language.nativeName}</span>
            </div>
            {locale === language.code && <Check className="text-accent h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
