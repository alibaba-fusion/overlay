const { getESLintConfig } = require('@iceworks/spec');

module.exports = getESLintConfig('react-ts', {
  extends: ['prettier'],
  env: {
    jest: true,
  },
  rules: {
    'no-nested-ternary': 'warn',
    '@typescript-eslint/no-shadow': 'warn',
    'react/no-find-dom-node': 'warn',
    'prefer-const': 'warn',
  },
});
