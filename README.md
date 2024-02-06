# tsargp

![screen capture gif](https://drive.google.com/uc?export=view&id=1bGzVFLEy3mUk1uBPeVGOiGv_1fBdOCUR 'screen capture gif')

## Features

- Fully declarative style with type checking
- Boolean, string, number and function types
- Value constraints (enums, regex and range)
- Arbitrary dependencies between options
- Deprecation, multi-valued
- Fully customizable help message formatting
- Wide range of display attributes from [SGR]
- Zero-dependency and small footprint (12KB minified)

## Demo

```sh
npm install -g tsargp
tsargp -h  # print the help message
tsargp     # see the options' default values
tsargp ... # play with option values
```

See the [source](examples/demo.ts).

## Usage

```sh
npm install -D tsargp
```

```ts
import { type Options, ArgumentParser } from 'tsargp';

const options = {
  // define options' attributes...
} as const satisfies Options;

const values = new ArgumentParser(options).parse();
// use `asyncParse` if you declare async fuction options
```

## Build

```sh
npm install     # install dependencies
npm test        # run unit tests
npm run dist    # build JS bundle
npm publish     # publish to npm registry
```

[SGR]: https://www.wikiwand.com/en/ANSI_escape_code#SGR_(Select_Graphic_Rendition)_parameters
