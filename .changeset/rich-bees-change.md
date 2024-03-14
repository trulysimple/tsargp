---
'@trulysimple/tsargp-docs': patch
---

You can now set environment variables in the demo (e.g., `NO_COLOR=1`). This works even when performing completion. One caveat though: if you set variables inline with a command (e.g., `VAR1=1 VAR2=2 <cmd> ...`) they will persist through future invocations of any command. To reset variables, use the syntax `VAR=`.
