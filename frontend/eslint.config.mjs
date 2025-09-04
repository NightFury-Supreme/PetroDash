// Flat ESLint config for Next.js (ESLint v9)
import next from 'eslint-config-next';

export default [
  // Base Next.js rules (core-web-vitals)
  ...next({ extends: ['core-web-vitals'] }),
  // Project overrides
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'warn'
    }
  },
  // Ignored paths
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
  }
];
