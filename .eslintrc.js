module.exports = {
  extends: ['expo'],
  rules: {
    'no-unused-vars': 'warn',
    'react/jsx-no-undef': 'error',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
};