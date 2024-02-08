# tsargp

![screen capture gif](https://drive.google.com/uc?export=view&id=1eckDPBDaXc355BY9s9LeTc2niTZaeKYZ 'screen capture gif')

## Features

- Fully declarative style with type checking
- Boolean, string, number and function types
- Value constraints: enums, regex, range, limit
- Value normalization: unique, trim, case
- Delimited, multivalued and positional args
- Arbitrary interdependencies between options
- Fully customizable help message formatting
- Wide range of display attributes from [SGR]
- Zero-dependency and small footprint

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
