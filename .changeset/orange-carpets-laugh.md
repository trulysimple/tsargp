---
'tsargp': minor
---

Added the `formatSections` method to the help formatter, that implements sections in the help message. Added the following properties to `HelpConfig`: `sections`, `styles` amd `misc`. Removed some attributes from the help option which are not needed anymore. (We will _not_ go through a deprecation process, since the library is under active development and not currently used by other packages.)
