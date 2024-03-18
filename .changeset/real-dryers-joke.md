---
'tsargp': minor
---

Added new classes to represent the various kinds of messages that the parser may return or throw from the parsing procedure, namely: help, version, error, warning and completion words. Accordingly, new methods were added to the parser class, that you can use to check for these messages. Here is a list of what was introduced in this change:

- `TerminalMessage` - base class for other message types
- `WarnMessage` - represents a warning message (e.g., for a deprecated option)
- `CompletionMessage` - the list of completion words
- `VersionMessage` - the version (currently, it's just a string)
- `ArgumentParser.doParse` - the most flexible method to parse arguments
- `ArgumentParser.tryParse` - a convenience method that catches any error before returning

Removed the `OpaqueArgumentParser` and `CastToOptionValues` as they are not needed anymore. Instead,
you can use `ArgumentParser` or `OptionValues` with no template argument.
