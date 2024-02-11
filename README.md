# tsargp

![screen capture gif](https://drive.google.com/uc?export=view&id=1-3HzqcmmYICLvcgUfaoCBwOVxSLSE9ku 'screen capture gif')

## Features

- Zero-dependency
- Fully declarative style
- Compile-time type checking
- Moderate footprint (~21KB minified)
- Fully customizable help message formatting
- Wide range of display attributes from [SGR]
- Arbitrary requirements between options
- Option grouping and hiding

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

```sh
npm install -g tsargp
tsargp -h  # print the help message
tsargp     # view options' default values
tsargp ... # play with option values
```

See the [source](examples/demo.options.ts).

## Usage

```sh
npm install -D tsargp
```

```ts
import { ArgumentParser, ... } from 'tsargp';

const options = {
  // define options' attributes...
} as const satisfies Options;

const values = new ArgumentParser(options).parse();
// use `parseAsync` if you declare async function options
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
