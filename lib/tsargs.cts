#!/usr/bin/env node

console.assert(require.main === module);

import('./demo.js')
  .then((demo) => new demo.OptionValues())
  .catch((error) => console.error(error));
