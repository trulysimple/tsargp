# tsargp

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
