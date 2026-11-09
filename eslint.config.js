// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'server/node_modules/*'],
  },
  {
    // Apostrophes inside React Native <Text> are plain text, not HTML entities.
    rules: { 'react/no-unescaped-entities': 'off' },
  },
]);
