---
'tsargp': minor
---

The parser was refactored to more easily handle asynchronous callbacks. As a consequence, it no longer supports a synchronous parsing method.

A new kind of validation, `invalidRequiredValue`, was implemented for the verification of required option values in the case of options that are either always required or have a default value.
