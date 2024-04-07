---
'tsargp': minor
---

Refactored the parser to ignore command-line arguments coming after the completion index. As a consequence, the `isComp` utility function and the `WithIsComp` type were removed, as they are no longer needed.
