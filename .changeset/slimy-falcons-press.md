---
'tsargp': minor
---

The parsing callbacks were refactored to accept a single parameter of type `ParseInfo`, which contains information about the current argument sequence in the parsing loop. The loop itself was refactored to accumulate a sequence of arguments that will be passed to the parsing callbacks as the option parameter(s). The `parseError` enumerator was removed from the `ErrorItem`, since it is no longer supported.
