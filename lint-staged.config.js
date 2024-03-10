import { dirname } from 'path';

export default {
  'package.json': (paths) => paths.map((path) => `publint --strict '${dirname(path)}'`),
  '*.{js,ts,jsx,tsx,mdx}': (paths) => `eslint ${paths.map((path) => `'${path}'`).join(' ')}`,
  '*': (paths) => [
    `cspell --no-must-find-files ${paths.map((path) => `'${path}'`).join(' ')}`,
    `prettier --write ${paths.map((path) => `'${path}'`).join(' ')}`,
  ],
};
