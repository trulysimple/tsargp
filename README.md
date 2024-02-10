# tsargp

![screen capture gif](https://drive.google.com/uc?export=view&id=1p58HP1jGqEPJf7emqKxeuY-_do53fNb1 'screen capture gif')

## Features

- Usability:
  - Zero-dependency
  - Fully declarative style
  - Compile-time type checking
  - Moderate footprint (~23KB minified)
- Presentation:
  - Fully customizable help message formatting
  - Wide range of display attributes from [SGR]
  - Reusable format configuration in JSON
  - Option grouping and hiding
- Option attributes:
  - Types: boolean, string, number, function, help, version
  - Parameters: single/multivalued, delimited, positional
  - Requirements: w/o value, logic expressions (and, or)
  - Constraints: enums, regex, range, count limit
  - Normalization: unique, trim, case conversion
  - Custom parsing

## Demo

```sh
npm install -g tsargp
tsargp -h  # print the help message
tsargp     # view options' default values
tsargp ... # play with option values
```

See the [source](examples/demo.ts).

## Usage

```sh
npm install -D tsargp
```

```ts
import * from 'tsargp';

const options = {
  // define options' attributes...
} as const satisfies Options;

const values = new ArgumentParser(options).parse();
// use `asyncParse` if you declare async fuction options
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
