const { getESLintConfig } = require('@iceworks/spec');

module.exports = getESLintConfig('react-ts', {
  extends: ['prettier'],
  env: {
    jest: true,
  },
});
