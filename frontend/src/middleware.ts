import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(es|en)/:path*',
    
    // Enable redirects that add the locale prefix
    // (e.g. /login -> /en/login, except we use as-needed so /login serves English directly)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
