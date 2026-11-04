import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handle = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return handle(request);
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: [
    '/',
    '/(ar|de|es|fr|hi|en)/:path*',
    '/((?!api|cdn|_next|_vercel|.*\\..*).*)',
  ],
};
