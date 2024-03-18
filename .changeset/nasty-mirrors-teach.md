---
'tsargp': minor
---

A new attribute called `requiredIf` was added to valued options, to indicate the option's conditional requirements. Similarly, a new enumerator was added to `HelpItem` to print this attribute in the help message. The same was done with the previously added `envVar` attribute, which had been forgotten. Both the parser and the formatter were updated to handle conditional option requirements.
