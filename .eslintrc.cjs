module.exports = {
  root: true,
  env: {
    node: true
  },
  plugins: ["jsdoc"],
  extends: [
    'digitalbazaar',
    'digitalbazaar/jsdoc',
    'digitalbazaar/module'
  ],
  rules: {
    "jsdoc/newline-after-description": 0,
  }
};
