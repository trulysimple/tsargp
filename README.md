# tsargp

Argument parser for TypeScript. Get started with the [documentation](https://trulysimple.dev/tsargp/docs).

## Features

- Usability:
  - Zero-dependency
  - Purely declarative
  - Type checking
  - Browser-compatible
  - Moderate footprint (<30KB minified)
- Functionality:
  - No-friction bash completion
  - Various option types to choose from
  - Arbitrary requirements between options
  - Value normalization and constraints
  - Option grouping and hiding
  - Option name suggestions
- Presentation:
  - Fully customizable help message format
  - Inline styles, text wrapping, paragraphs and lists
  - Wide range of display attributes from [SGR]

## Demo

Test it [online](https://trulysimple.dev/tsargp/demo) or install it locally:

```sh
npm install -g tsargp
complete -C tsargp tsargp # enable bash completion
tsargp -h  # print the help message
tsargp -v  # print the package version
tsargp     # view options' default values
tsargp ... # play with option values
```

See the [source](examples/demo.options.ts).

## Usage

```sh
npm install tsargp
```

Define your command-line options (we recommend placing them in a separate file):

```ts
// <your_cli_name>.options.ts
import { Options, ... } from 'tsargp';

export default {
  // define options' attributes...
} as const satisfies Options;
```

Import them in your main script:

```ts
#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './<your_cli_name>.options.js';

try {
  const parser = new ArgumentParser(options);
  parser.validate(); // validate the options' definitions (you can skip this in production)
  // const values = parser.parse();             // use this to get the options' values
  // const values = await parser.parseAsync();  // use this if you declare async function options
  // parser.parseInto(myValues);                // use this if your values are enclosed in a class
} catch (err) {
  if (typeof err === 'string') {
    console.log(err); // help message, version or bash completion words
  } else {
    console.error(err); // genuine errors
    process.exitCode = 1;
  }
}
```

Optionally, enable bash completion:

```sh
complete -o default -C <your_cli_name> <your_cli_name>
```

## Build

```sh
curl -fsSL https://bun.sh/install | bash
bun install   # install dependencies
bun test      # run unit tests
bun run dist  # build JS bundle
npm publish   # publish to npm registry
```

[SGR]: https://www.wikiwand.com/en/ANSI_escape_code#SGR_(Select_Graphic_Rendition)_parameters
