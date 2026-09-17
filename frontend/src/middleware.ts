import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    '/',
    '/(ar|de|es|fr|hi|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
