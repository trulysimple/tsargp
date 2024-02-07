import { dirname } from 'path';

export default {
  'package.json': (paths) => paths.map((path) => `publint --strict '${dirname(path)}'`),
  '*.spec.ts': (paths) => `bun test ${paths.map((path) => `'${path}'`).join(' ')}`,
  '*.ts': (paths) => `eslint ${paths.map((path) => `'${path}'`).join(' ')}`,
  '*': (paths) => [
    `cspell lint ${paths.map((path) => `'${path}'`).join(' ')}`,
    `prettier --write ${paths.map((path) => `'${path}'`).join(' ')}`,
  ],
};
