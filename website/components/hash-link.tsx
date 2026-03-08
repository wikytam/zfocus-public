'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useCallback } from 'react';

export const HashLink = ({
  hash,
  className,
  children,
}: React.PropsWithChildren<{
  hash: string;
  className?: string;
}>) => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isHomePage) {
        e.preventDefault();
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          window.history.replaceState(null, '', `#${hash}`);
        }
      }
    },
    [hash, isHomePage],
  );

  return (
    <Link href={`/#${hash}`} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};
