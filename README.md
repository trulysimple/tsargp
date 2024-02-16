# tsargp

A zero-dependency argument parser for TypeScript. Get started with the [documentation](https://trulysimple.dev/tsargp/docs).

## Features

- Fully declarative style with type checking
- Moderate footprint (less than 30KB minified)
- Fully customizable help message formatting
  - Inline styles, text wrapping, paragraphs and lists
  - Wide range of display attributes from [SGR]
- Arbitrary requirements between options
- Option grouping, hiding and name suggestions

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
  const values = new ArgumentParser(options).parse();
  // do something with values
} catch (err) {
  if (typeof err === 'string') {
    console.log(err);
  } else {
    console.error(err);
    process.exitCode = 1;
  }
}
```

Use `parseAsync` if you declare async function options or a version option with a module-resolve function.
Use `parseInto` if your values are enclosed in a class.
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
