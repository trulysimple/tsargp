# tsargp

## 0.3.0-dev.4

### Minor Changes

- [#61](https://github.com/trulysimple/tsargp/pull/61) [`0a9ce4e`](https://github.com/trulysimple/tsargp/commit/0a9ce4e7f0e8a85e5641236282aac96609d584df) Thanks [@disog](https://github.com/disog)! - Added text alignment settings for option parameter and description in the help message. Added a `rightAlign` property to terminal strings, that makes the wrapping procedure align text to the terminal's right boundary.

- [#66](https://github.com/trulysimple/tsargp/pull/66) [`77b6bf0`](https://github.com/trulysimple/tsargp/commit/77b6bf03b222868d37b26716bd14f9834ab4293f) Thanks [@disog](https://github.com/disog)! - Added the `clusterLetters` attribute to valued options, to support the so called "short-options" style. Added the `shortStyle` configuration property to the parser configuration, to indicate that the first command-line argument is expected to be an option cluster. These two must be used in conjunction.

### Patch Changes

- [#64](https://github.com/trulysimple/tsargp/pull/64) [`94ddf59`](https://github.com/trulysimple/tsargp/commit/94ddf59ec36ccd231f3ea5adbd8024093ba26573) Thanks [@disog](https://github.com/disog)! - Refactored the `HelpConfig` to reuse the same object for configuring the help columns. Improved the wrapping procedure to emit all control sequences when `emitStyles` is true.

## 0.3.0-dev.3

### Minor Changes

- [#60](https://github.com/trulysimple/tsargp/pull/60) [`95736cf`](https://github.com/trulysimple/tsargp/commit/95736cfc3bc3b9d8c1396302674d58e482b56aa3) Thanks [@disog](https://github.com/disog)! - Added a help format configuration named `align`, that can be used to select the alignment of option names in the help message.

- [#53](https://github.com/trulysimple/tsargp/pull/53) [`df5d7a4`](https://github.com/trulysimple/tsargp/commit/df5d7a49fb7b97affcf87d63f02f558251cca787) Thanks [@disog](https://github.com/disog)! - Added the `formatSections` method to the help formatter, that implements sections in the help message. Added the following properties to `HelpConfig`: `sections`, `styles` amd `misc`. Removed some attributes from the help option which are not needed anymore. (We will _not_ go through a deprecation process, since the library is under active development and not currently used by other packages.)

## 0.3.0-dev.2

### Minor Changes

- [#49](https://github.com/trulysimple/tsargp/pull/49) [`4a76dc1`](https://github.com/trulysimple/tsargp/commit/4a76dc17b2c82d089284348918a54a5cd454e639) Thanks [@disog](https://github.com/disog)! - A new attribute called `requiredIf` was added to valued options, to indicate the option's conditional requirements. Similarly, a new enumerator was added to `HelpItem` to print this attribute in the help message. Both the parser and the formatter were updated to handle conditional option requirements.

## 0.3.0-dev.1

### Minor Changes

- [#48](https://github.com/trulysimple/tsargp/pull/48) [`4050cb9`](https://github.com/trulysimple/tsargp/commit/4050cb9bc20c6c9cbd46bf6ef099af50aee82f9b) Thanks [@disog](https://github.com/disog)! - Added new classes to represent the various kinds of messages that the parser may return or throw from the parsing procedure, namely: help, version, error, warning and completion words. Accordingly, new methods were added to the parser class, that you can use to check for these messages. Here is a list of what was introduced in this change:

  - `TerminalMessage` - base class for other message types
  - `WarnMessage` - represents a warning message (e.g., for a deprecated option)
  - `CompletionMessage` - the list of completion words
  - `VersionMessage` - the version (currently, it's just a string)
  - `ArgumentParser.doParse` - the most flexible method to parse arguments
  - `ArgumentParser.tryParse` - a convenience method that catches any error before returning

  Removed the `OpaqueArgumentParser` and `CastToOptionValues` as they are not needed anymore. Instead,
  you can use `ArgumentParser` or `OptionValues` with no template argument.

- [#45](https://github.com/trulysimple/tsargp/pull/45) [`889da8a`](https://github.com/trulysimple/tsargp/commit/889da8aa6e25e033a7992ac6975926cd62975e01) Thanks [@disog](https://github.com/disog)! - The package was refactored to remove unneeded exports, which reduced the footprint of the minified module.

## 0.3.0-dev.0

### Minor Changes

- [#42](https://github.com/trulysimple/tsargp/pull/42) [`c0fc66a`](https://github.com/trulysimple/tsargp/commit/c0fc66acce925875645c331a2ee060a669f28797) Thanks [@disog](https://github.com/disog)! - Added a new `envVar` attribute to options that have a value, to read the value from an environment variable. Also, function and command options now have the ability to define `default` values.

- [#33](https://github.com/trulysimple/tsargp/pull/33) [`f7cc353`](https://github.com/trulysimple/tsargp/commit/f7cc353204831d1a723d05c9309d5619f17d7649) Thanks [@disog](https://github.com/disog)! - `ParseConfig` has a new field called `progName` which specifies the program name used to update the process title. It defaults to the basename of the executing script (if no command is provided), or to the command name, in case a raw command-line string is provided.

- [#41](https://github.com/trulysimple/tsargp/pull/41) [`6acda27`](https://github.com/trulysimple/tsargp/commit/6acda27268390f8c1e9fb3ce7256a069c99b4f2e) Thanks [@disog](https://github.com/disog)! - The demo example now has a `help` command that prints the help of another nested command (currently, only `hello`).

## 0.2.9

### Patch Changes

- [#39](https://github.com/trulysimple/tsargp/pull/39) [`d0028a2`](https://github.com/trulysimple/tsargp/commit/d0028a253eff2cd61fe2b68cef43184e7b914a15) Thanks [@disog](https://github.com/disog)! - The datatype of a required option was fixed to be non-optional (i.e., it cannot be `undefined`).

## 0.2.8

### Patch Changes

- [#36](https://github.com/trulysimple/tsargp/pull/36) [`4fbbfaa`](https://github.com/trulysimple/tsargp/commit/4fbbfaab1a5faf7297696d47f34481bbf79a2356) Thanks [@disog](https://github.com/disog)! - The data type of an option with `enums` was fixed. Now it will have a union base type, as expected.

## 0.2.7

### Patch Changes

- [#30](https://github.com/trulysimple/tsargp/pull/30) [`e9d8c9b`](https://github.com/trulysimple/tsargp/commit/e9d8c9bcb4b464345689025e73cbc9a6019615e5) Thanks [@disog](https://github.com/disog)! - A new page was added in the project website for code documentation generated with [TypeDoc](https://typedoc.org/). It's called "API" and is served under the `api` subpath.

## 0.2.6

### Patch Changes

- [#26](https://github.com/trulysimple/tsargp/pull/26) [`e039ba2`](https://github.com/trulysimple/tsargp/commit/e039ba2aefa049ba18108cb793c2eef46acf1142) Thanks [@disog](https://github.com/disog)! - You can now set the `NO_COLOR` environment variable to _omit_ styles from error and help messages.
  You can also set `FORCE_COLOR` to _emit_ styles even when the output is being redirected.
