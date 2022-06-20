import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'main.js',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true
  },
  // Using nodeResolve to bundle the base58-universal library within the output dist/main.js
  // This is required as digitalbazaar has migrated this library to be an ES module, 
  // making it incompatible with @mattrglobal/opencore
  plugins: [nodeResolve({ resolveOnly: ["base58-universal"] })]
};