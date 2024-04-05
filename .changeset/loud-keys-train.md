---
'tsargp': minor
---

Added the `paramCount` attribute to the function option, to specify the number of parameters that the option expects in the command-line. New enumerators, `invalidParamCount` and `variadicWithClusterLetter`, were added to `ErrorItem`, that are used by the validator when validating the new attribute. The formatter was updated to take this attribute into account when rendering the description of variadic options.
