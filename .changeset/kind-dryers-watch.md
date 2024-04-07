---
'tsargp': minor
---

Replaced the ANSI escape code `\x9b` by the more traditional `\x1b[`, in order to support terminals that do not recognize the former. Fixed the `getArgs` procedure to support word completion in PowerShell.
