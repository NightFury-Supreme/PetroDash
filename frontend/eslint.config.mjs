import { fixupPluginRules } from '@eslint/compat';
import next from 'eslint-config-next';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        React: 'readonly'
      }
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', 'never'],
      'keyword-spacing': 'error',
      'space-infix-ops': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'prefer-const': 'error',
      'no-var': 'error',
      'arrow-spacing': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off'
    }
  }
];
