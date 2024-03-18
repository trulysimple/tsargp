# @trulysimple/tsargp-docs

## 0.2.0-dev.1

### Minor Changes

- [#48](https://github.com/trulysimple/tsargp/pull/48) [`4050cb9`](https://github.com/trulysimple/tsargp/commit/4050cb9bc20c6c9cbd46bf6ef099af50aee82f9b) Thanks [@disog](https://github.com/disog)! - Added a new section called "Terminal messages" in the Styles page to describe the various kinds of messages produced by the library. Updated the Parser page to document the new parsing methods that can be used to check for these messages. Also updated the Validator page to document the new `deprecatedOption` warning.

## 0.2.0-dev.0

### Minor Changes

- [#41](https://github.com/trulysimple/tsargp/pull/41) [`6acda27`](https://github.com/trulysimple/tsargp/commit/6acda27268390f8c1e9fb3ce7256a069c99b4f2e) Thanks [@disog](https://github.com/disog)! - Added a new guide page called "Help", to describe how to implement different help mechanisms for a CLI application.

### Patch Changes

- [#33](https://github.com/trulysimple/tsargp/pull/33) [`f7cc353`](https://github.com/trulysimple/tsargp/commit/f7cc353204831d1a723d05c9309d5619f17d7649) Thanks [@disog](https://github.com/disog)! - The Parser page was updated to document the new `progName` field of the parse configuration, as well as add a new section to explain how the process title is updated by the parser.

- [#42](https://github.com/trulysimple/tsargp/pull/42) [`c0fc66a`](https://github.com/trulysimple/tsargp/commit/c0fc66acce925875645c331a2ee060a669f28797) Thanks [@disog](https://github.com/disog)! - The documentation was updated to include the new `envVar` attribute, as well as to group attributes that are shared by valued options into a new section called "Value attributes".

## 0.1.47

### Patch Changes

- [#30](https://github.com/trulysimple/tsargp/pull/30) [`e9d8c9b`](https://github.com/trulysimple/tsargp/commit/e9d8c9bcb4b464345689025e73cbc9a6019615e5) Thanks [@disog](https://github.com/disog)! - A new page was added in the project website for code documentation generated with [TypeDoc](https://typedoc.org/). It's called "API" and is served under the `api` subpath.

## 0.1.46

### Patch Changes

- [#29](https://github.com/trulysimple/tsargp/pull/29) [`065bc1b`](https://github.com/trulysimple/tsargp/commit/065bc1b6ec941a5ca3a9b5df238339fa76b43a57) Thanks [@disog](https://github.com/disog)! - You can now set environment variables in the demo (e.g., `NO_COLOR=1`). This works even when performing completion. One caveat though: if you set variables inline with a command (e.g., `VAR1=1 VAR2=2 <cmd> ...`) they will persist through future invocations of any command. To reset variables, use the syntax `VAR=`.

## 0.1.45

### Patch Changes

- [#4](https://github.com/trulysimple/tsargp/pull/4) [`639c040`](https://github.com/trulysimple/tsargp/commit/639c0400b6031c0e9c20ddbb4ff5c850fac64f86) Thanks [@disog](https://github.com/disog)! - The "Report Bug" button in the playground now uses the "Bug Report" issue template.
