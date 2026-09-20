import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import path from 'path';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',')
  : [];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  },
  turbopack: {
    root: path.resolve(process.cwd(), '..'),
  },
  output: 'standalone',
  ...(allowedDevOrigins.length > 0 && { allowedDevOrigins }),
};

export default withNextIntl(nextConfig); 