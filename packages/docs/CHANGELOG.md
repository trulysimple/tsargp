# @trulysimple/tsargp-docs

## 0.1.46

### Patch Changes

- [#29](https://github.com/trulysimple/tsargp/pull/29) [`065bc1b`](https://github.com/trulysimple/tsargp/commit/065bc1b6ec941a5ca3a9b5df238339fa76b43a57) Thanks [@disog](https://github.com/disog)! - You can now set environment variables in the demo (e.g., `NO_COLOR=1`). This works even when performing completion. One caveat though: if you set variables inline with a command (e.g., `VAR1=1 VAR2=2 <cmd> ...`) they will persist through future invocations of any command. To reset variables, use the syntax `VAR=`.

## 0.1.45

### Patch Changes

- [#4](https://github.com/trulysimple/tsargp/pull/4) [`639c040`](https://github.com/trulysimple/tsargp/commit/639c0400b6031c0e9c20ddbb4ff5c850fac64f86) Thanks [@disog](https://github.com/disog)! - The "Report Bug" button in the playground now uses the "Bug Report" issue template.
