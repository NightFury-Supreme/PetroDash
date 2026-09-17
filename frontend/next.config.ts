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

// trigger reload 4

// trigger reload 5

// trigger reload 6

// trigger reload 7

// trigger reload 8

// trigger reload 9

// trigger reload 10

// trigger reload 11

// trigger reload 12

// trigger reload 13

// trigger reload 14

// trigger reload 15

// trigger reload 16

// trigger reload 17

// trigger reload 18

// trigger reload 19

// trigger reload 20
