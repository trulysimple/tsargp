# tsargp

**tsargp** is a command-line argument parsing library that helps you write clean code.

Get started with the [documentation](https://trulysimple.dev/tsargp/docs).

## Demo

Test it [online](https://trulysimple.dev/tsargp/demo) or install it locally:

```sh
npm i -g tsargp && complete -C tsargp tsargp

tsargp -h         # print the help message
tsargp -v         # print the package version
tsargp            # view the options' default values
tsargp ...        # play with option values
tsargp hello ...  # test the hello command
```

See the [source](examples/demo.options.ts).

## Usage

Define your command-line options (we recommend placing them in a separate file):

```ts
// <your_cli_name>.options.ts
import { type Options, ... } from 'tsargp';

export default {
  // define the options' attributes...
} as const satisfies Options;
```

Import them in your main script:

```ts
#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './<your_cli_name>.options.js';

try {
  const parser = new ArgumentParser(options);
  parser.validate(); // validate the option definitions (you can skip this in production)
  const values = await parser.parse(); // use this to get the options' values
  // await parser.parseInto(myValues); // use this for an existing object or class instance
} catch (err) {
  if (err instanceof Error) {
    console.error(`${err}`); // genuine errors
    process.exitCode = 1;
  } else {
    console.log(`${err}`); // help message, version or completion words
  }
}
```

Optionally, enable word completion:

```sh
complete -o default -C <path_to_main_script> <your_cli_name>
```

## Build

```sh
curl -fsSL https://bun.sh/install | bash
bun install   # install dependencies
bun test      # run unit tests
npm publish   # publish to npm registry
```
