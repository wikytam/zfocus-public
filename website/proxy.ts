import { routing } from './i18n/routing';
import createMiddleware from 'next-intl/middleware';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(vi|ko|ja|zh)/:path*', '/((?!_next|api|.*\\..*).*)'],
};
