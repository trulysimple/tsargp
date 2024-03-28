---
'tsargp': minor
---

Removed the `parseDelimited` attribute in anticipation for a new and better feature yet to be implemented. This parsing callback was not really important, whereas the same effect can be achieved with the `parse` callback by modifying the previous option value.

Improved the formatting of custom phrases for both error and help messages. Now they can contain multiple groups referencing the same phrase alternatives across groups. This also allowed the help item phrases to use specifiers for different value data types.

Added a new kind of validation, `invalidNumericRange`, for the option's numeric range definition. Some other enumerators were merged into one that uses a phrase containing different format specifiers for each alternative.

Refactored the `ul` enumeration into a constant that holds underline styles instead of underline colors (since it had just one color that was not strictly necessary).
