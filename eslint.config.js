const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      'web/dist/**',
      'web/.astro/**',
      '.expo/**',
      '.asc/**',
      '.hallmark/**',
      '.wrangler/**',
      'goldie/**',
      'coverage/**',
      'min-kit-disseny/**',
    ],
  },
]);
