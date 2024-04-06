---
'tsargp': minor
---

Added the `useNested` attribute to the help option, which allows the argument following the option to be used as the name
of a nested command for which the help message should be assembled.

For example, the invocation `cli --help cmd` would throw the help of the `cmd` command, if it exists. If not, or if it does not have a help option, the argument may still be used as an option filter, if the `useFilter` attribute is set.

The nested command may also enable filtering in its help option definition. For example, the invocation `cli --help cmd -f` would throw the help of the `cmd` command, filtered by the pattern `-f`.
