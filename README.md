# tsargp

A modern argument parser for TypeScript.

## Features

- Zero-dependency
- Fully declarative style
- Compile-time type checking
- Moderate footprint (~25KB minified)
- Fully customizable help message formatting
- Inline styles, text wrapping, paragraphs and lists
- Wide range of display attributes from [SGR]
- Arbitrary requirements between options
- Option grouping and hiding
- Similar name suggestions

Here's a summary of the available option types and some of their attributes:

| Option type | Parameters                           | Data type  | Normalization      | Constraints         |
| ----------- | ------------------------------------ | ---------- | ------------------ | ------------------- |
| help        | niladic                              |            |                    |                     |
| version     | niladic                              |            |                    |                     |
| function    | niladic                              |            |                    |                     |
| flag        | niladic                              | `boolean`  |                    |                     |
| boolean     | positional, single                   | `boolean`  |                    |                     |
| string      | positional, single                   | `string`   | trim, case         | enums, regex        |
| number      | positional, single                   | `number`   | round              | enums, range        |
| strings     | positional, multi, delimited, append | `string[]` | unique, trim, case | enums, regex, limit |
| numbers     | positional, multi, delimited, append | `number[]` | unique, round      | enums, range, limit |

Other attributes include: default value, example value, custom value parsing, and more.

## Demo

Test it [online](https://trulysimple.dev/tsargp/demo) or install it locally:

```sh
npm install -g tsargp
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

We encourage you to place option definitions in a separate file, like so:

```ts
// <your_cli_name>.options.ts
import { Options, ... } from 'tsargp';

export default {
  // define options' attributes...
} as const satisfies Options;
```

And import them in your main script:

```ts
import { ArgumentParser } from 'tsargp';
import options from './<your_cli_name>.options.js';

const values = new ArgumentParser(options).parse();
// use `parseAsync` if you declare async function options
//  or a version option with a module-resolve function
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
