import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',')
  : [];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  },
  output: 'standalone',
  ...(allowedDevOrigins.length > 0 && { allowedDevOrigins }),
};

export default withNextIntl(nextConfig);