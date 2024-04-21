# tsargp

## 0.8.0

### Minor Changes

- [#179](https://github.com/trulysimple/tsargp/pull/179) [`ea85505`](https://github.com/trulysimple/tsargp/commit/ea855050048581c5eec1502072e8f162ccf10692) Thanks [@disog](https://github.com/disog)! - The function option now supports environment variables.

## 0.7.2

### Patch Changes

- [#177](https://github.com/trulysimple/tsargp/pull/177) [`8dfe53b`](https://github.com/trulysimple/tsargp/commit/8dfe53b8d7ac0e7c00c884984145f1f60555e801) Thanks [@disog](https://github.com/disog)! - Fixed the default value of the `compIndex` parsing flag when providing a set of flags without it.

## 0.7.1

### Patch Changes

- [#172](https://github.com/trulysimple/tsargp/pull/172) [`fee4848`](https://github.com/trulysimple/tsargp/commit/fee484816b56a6a47ba489b465afd2a6a0e18425) Thanks [@disog](https://github.com/disog)! - Option requirements are now correctly rendered in the help message when they have negated requirement objects.

## 0.7.0

### Minor Changes

- [#167](https://github.com/trulysimple/tsargp/pull/167) [`d2e7fb7`](https://github.com/trulysimple/tsargp/commit/d2e7fb744eea345b7fad634a40c9efdd495f52e2) Thanks [@disog](https://github.com/disog)! - The `example` value is now enclosed in square brackets in the help message when the option has a fallback value, just as is done with parameter names and option types.

- [#167](https://github.com/trulysimple/tsargp/pull/167) [`d2e7fb7`](https://github.com/trulysimple/tsargp/commit/d2e7fb744eea345b7fad634a40c9efdd495f52e2) Thanks [@disog](https://github.com/disog)! - The `noInline` attribute was renamed to `inline` and supports a new value `always`, which indicates that the option _requires_ inline parameters. A new help item, `inline`, was added to report if an option disallows or requires inline parameters.

- [#167](https://github.com/trulysimple/tsargp/pull/167) [`d2e7fb7`](https://github.com/trulysimple/tsargp/commit/d2e7fb744eea345b7fad634a40c9efdd495f52e2) Thanks [@disog](https://github.com/disog)! - The `align` property of help columns now support a `merge` value, which instructs the formatter to merge the contents of the column with the previous one.

- [#167](https://github.com/trulysimple/tsargp/pull/167) [`d2e7fb7`](https://github.com/trulysimple/tsargp/commit/d2e7fb744eea345b7fad634a40c9efdd495f52e2) Thanks [@disog](https://github.com/disog)! - The `noInline` attribute was added for non-niladic options, to disallow inline parameters.

- [#167](https://github.com/trulysimple/tsargp/pull/167) [`d2e7fb7`](https://github.com/trulysimple/tsargp/commit/d2e7fb744eea345b7fad634a40c9efdd495f52e2) Thanks [@disog](https://github.com/disog)! - The parameter column in the help message now shows an ellipsis `...` for variadic options with example values, as well as an equals sign `=` for options the require inline parameters. The parser was modified to disallow inline parameters of variadic options.

- [#167](https://github.com/trulysimple/tsargp/pull/167) [`d2e7fb7`](https://github.com/trulysimple/tsargp/commit/d2e7fb744eea345b7fad634a40c9efdd495f52e2) Thanks [@disog](https://github.com/disog)! - The usage section in help messages now supports option dependencies through the `requires` attribute. This is related to option requirements, but somewhat different.

## 0.7.0-dev.1

### Minor Changes

- [#166](https://github.com/trulysimple/tsargp/pull/166) [`06f3269`](https://github.com/trulysimple/tsargp/commit/06f3269f2c7e95d12821ec04d0c711f679f19992) Thanks [@disog](https://github.com/disog)! - The `example` value is now enclosed in square brackets in the help message when the option has a fallback value, just as is done with parameter names and option types.

- [#163](https://github.com/trulysimple/tsargp/pull/163) [`65196aa`](https://github.com/trulysimple/tsargp/commit/65196aa507ca7352eb451efd4abbe12d3f9ad183) Thanks [@disog](https://github.com/disog)! - The usage section in help messages now supports option dependencies through the `requires` attribute. This is related to option requirements, but somewhat different.

## 0.7.0-dev.0

### Minor Changes

- [#153](https://github.com/trulysimple/tsargp/pull/153) [`9a54671`](https://github.com/trulysimple/tsargp/commit/9a5467135a1d962820ac24d515c0b4468ee88d79) Thanks [@disog](https://github.com/disog)! - The `noInline` attribute was renamed to `inline` and supports a new value `always`, which indicates that the option _requires_ inline parameters. A new help item, `inline`, was added to report if an option disallows or requires inline parameters.

- [#159](https://github.com/trulysimple/tsargp/pull/159) [`9476b4a`](https://github.com/trulysimple/tsargp/commit/9476b4a797e8e928bcc2568ac7f0ec242871027c) Thanks [@disog](https://github.com/disog)! - The `align` property of help columns now support a `merge` value, which instructs the formatter to merge the contents of the column with the previous one.

- [#150](https://github.com/trulysimple/tsargp/pull/150) [`534d816`](https://github.com/trulysimple/tsargp/commit/534d816e9e0828c3e5729cb5b2ccc1db3b8228af) Thanks [@disog](https://github.com/disog)! - The `noInline` attribute was added for non-niladic options, to disallow inline parameters.

- [#155](https://github.com/trulysimple/tsargp/pull/155) [`178e97e`](https://github.com/trulysimple/tsargp/commit/178e97e235527aeb0b48060c19df87078ccbbe03) Thanks [@disog](https://github.com/disog)! - The parameter column in the help message now shows an ellipsis `...` for variadic options with example values, as well as an equals sign `=` for options the require inline parameters. The parser was modified to disallow inline parameters of variadic options.

## 0.6.0

### Minor Changes

- [#146](https://github.com/trulysimple/tsargp/pull/146) [`a8d7d30`](https://github.com/trulysimple/tsargp/commit/a8d7d3011f5bf81b88d22570c59b61be18b95256) Thanks [@disog](https://github.com/disog)! - The `useNested`, `useFormat` and `useFilter` attributes of help options can now be used as help items.

- [#146](https://github.com/trulysimple/tsargp/pull/146) [`a8d7d30`](https://github.com/trulysimple/tsargp/commit/a8d7d3011f5bf81b88d22570c59b61be18b95256) Thanks [@disog](https://github.com/disog)! - A new formatter class, `CsvFormatter`, was added to handle formatting of help messages in CSV format.

- [#146](https://github.com/trulysimple/tsargp/pull/146) [`a8d7d30`](https://github.com/trulysimple/tsargp/commit/a8d7d3011f5bf81b88d22570c59b61be18b95256) Thanks [@disog](https://github.com/disog)! - The connective words were extended to include array element separators and string quoting.

- [#146](https://github.com/trulysimple/tsargp/pull/146) [`a8d7d30`](https://github.com/trulysimple/tsargp/commit/a8d7d3011f5bf81b88d22570c59b61be18b95256) Thanks [@disog](https://github.com/disog)! - A new formatter class was added, `MdFormatter`, to format help messages in Markdown format.

- [#146](https://github.com/trulysimple/tsargp/pull/146) [`a8d7d30`](https://github.com/trulysimple/tsargp/commit/a8d7d3011f5bf81b88d22570c59b61be18b95256) Thanks [@disog](https://github.com/disog)! - Added support for asynchronous `OptionsCallback` in the command option. This allows the option to load definitions from a different module dynamically.

- [#146](https://github.com/trulysimple/tsargp/pull/146) [`a8d7d30`](https://github.com/trulysimple/tsargp/commit/a8d7d3011f5bf81b88d22570c59b61be18b95256) Thanks [@disog](https://github.com/disog)! - The `HelpFormat` type was introduced, as well as a `JsonFormatter` class that handles formatting of help messages in JSON format.

## 0.6.0-dev.0

### Minor Changes

- [#144](https://github.com/trulysimple/tsargp/pull/144) [`41fde68`](https://github.com/trulysimple/tsargp/commit/41fde6861b27375d27231555e7d11c11e22482ad) Thanks [@disog](https://github.com/disog)! - The `useNested`, `useFormat` and `useFilter` attributes of help options can now be used as help items.

- [#143](https://github.com/trulysimple/tsargp/pull/143) [`4eae787`](https://github.com/trulysimple/tsargp/commit/4eae7873698ff6c93bd738049fce42a845237f9e) Thanks [@disog](https://github.com/disog)! - A new formatter class, `CsvFormatter`, was added to handle formatting of help messages in CSV format.

- [#137](https://github.com/trulysimple/tsargp/pull/137) [`d6e2a8d`](https://github.com/trulysimple/tsargp/commit/d6e2a8dbc0c8435d30d6fa9784f75d7f8b832a9c) Thanks [@disog](https://github.com/disog)! - The connective words were extended to include array element separators and string quoting.

- [#145](https://github.com/trulysimple/tsargp/pull/145) [`a5c29e8`](https://github.com/trulysimple/tsargp/commit/a5c29e860d4da62617f2795686b7938f950692a7) Thanks [@disog](https://github.com/disog)! - A new formatter class was added, `MdFormatter`, to format help messages in Markdown format.

- [#133](https://github.com/trulysimple/tsargp/pull/133) [`a3bb85a`](https://github.com/trulysimple/tsargp/commit/a3bb85a58dedcd25121e99a1163f2e6543a206e4) Thanks [@disog](https://github.com/disog)! - Added support for asynchronous `OptionsCallback` in the command option. This allows the option to load definitions from a different module dynamically.

- [#140](https://github.com/trulysimple/tsargp/pull/140) [`377f45b`](https://github.com/trulysimple/tsargp/commit/377f45b4825564eee9606346d59dae9c6a5a2a24) Thanks [@disog](https://github.com/disog)! - The `HelpFormat` type was introduced, as well as a `JsonFormatter` class that handles formatting of help messages in JSON format.

## 0.5.1

### Patch Changes

- [#130](https://github.com/trulysimple/tsargp/pull/130) [`dbeee87`](https://github.com/trulysimple/tsargp/commit/dbeee879d85f64a15efa200e46de52a09dcd2d20) Thanks [@disog](https://github.com/disog)! - The wording for the `tooSimilarOptionNames` and `mixedNamingConvention` warnings was changed.

## 0.5.0

### Minor Changes

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - Cluster arguments now support inline parameters (this is not to be confused with inline parameters of normal arguments).

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - Updated the code to consider the boolean's truth and falsity names wherever the `enums` attribute is used.

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - The `shortStyle` configuration flag was replaced by the more generic `clusterPrefix`, which allows cluster arguments anywhere in the command line.

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - In addition to the `COMP_LINE` and `COMP_POINT` environment variables, the parsing methods now read default values of the command line and completion index from the `BUFFER` and `CURSOR` variables, respectively.

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - Replaced the ANSI escape code `\x9b` by the more traditional `\x1b[`, in order to support terminals that do not recognize the former. Fixed the `getArgs` procedure to support word completion in PowerShell.

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - Refactored the parser to ignore command-line arguments coming after the completion index. As a consequence, the `isComp` utility function and the `WithIsComp` type were removed, as they are no longer needed.

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - Added the `useNested` attribute to the help option, which allows the argument following the option to be used as the name of a nested command for which the help message should be assembled.

  For example, the invocation `cli --help cmd` would throw the help of the `cmd` command, if it exists. If not, or if it does not have a help option, the argument may still be used as an option filter, if the `useFilter` attribute is set.

  The nested command may also enable filtering in its help option definition. For example, the invocation `cli --help cmd -f` would throw the help of the `cmd` command, filtered by the pattern `-f`.

### Patch Changes

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - The parsing methods now support characters escaped with `\` in raw command lines.

- [#126](https://github.com/trulysimple/tsargp/pull/126) [`544e01e`](https://github.com/trulysimple/tsargp/commit/544e01e34ac25d68fd3f06a70856ece6d1f01cf5) Thanks [@disog](https://github.com/disog)! - The parsing procedures now accept the `BUFFER` environment variable without its sibling `CURSOR` variable.

## 0.5.0-dev.0

### Minor Changes

- [#123](https://github.com/trulysimple/tsargp/pull/123) [`755698d`](https://github.com/trulysimple/tsargp/commit/755698d1d7e93adfdb4ceaf5713f919124c13954) Thanks [@disog](https://github.com/disog)! - Cluster arguments now support inline parameters (this is not to be confused with inline parameters of normal arguments).

- [#111](https://github.com/trulysimple/tsargp/pull/111) [`434bb74`](https://github.com/trulysimple/tsargp/commit/434bb74334101036ca2b43a9fb57c96221c6f87f) Thanks [@disog](https://github.com/disog)! - Updated the code to consider the boolean's truth and falsity names wherever the `enums` attribute is used.

- [#121](https://github.com/trulysimple/tsargp/pull/121) [`fe66f44`](https://github.com/trulysimple/tsargp/commit/fe66f4408ef9a2a8090eafe7b8edb2dc19383004) Thanks [@disog](https://github.com/disog)! - The `shortStyle` configuration flag was replaced by the more generic `clusterPrefix`, which allows cluster arguments anywhere in the command line.

- [#115](https://github.com/trulysimple/tsargp/pull/115) [`2680b4e`](https://github.com/trulysimple/tsargp/commit/2680b4e67988147ef11988ea64236bf0715d4eea) Thanks [@disog](https://github.com/disog)! - In addition to the `COMP_LINE` and `COMP_POINT` environment variables, the parsing methods now read default values of the command line and completion index from the `BUFFER` and `CURSOR` variables, respectively.

- [#110](https://github.com/trulysimple/tsargp/pull/110) [`d78f8cd`](https://github.com/trulysimple/tsargp/commit/d78f8cd6a450e8734ed3d4c4c29662932766f81c) Thanks [@disog](https://github.com/disog)! - Replaced the ANSI escape code `\x9b` by the more traditional `\x1b[`, in order to support terminals that do not recognize the former. Fixed the `getArgs` procedure to support word completion in PowerShell.

- [#113](https://github.com/trulysimple/tsargp/pull/113) [`a0fd953`](https://github.com/trulysimple/tsargp/commit/a0fd9539661773240cb9c3aaa8d6878ca904db56) Thanks [@disog](https://github.com/disog)! - Refactored the parser to ignore command-line arguments coming after the completion index. As a consequence, the `isComp` utility function and the `WithIsComp` type were removed, as they are no longer needed.

- [#105](https://github.com/trulysimple/tsargp/pull/105) [`e2f4c78`](https://github.com/trulysimple/tsargp/commit/e2f4c781ebbba78939e5da8a0505e5f141215a8d) Thanks [@disog](https://github.com/disog)! - Added the `useNested` attribute to the help option, which allows the argument following the option to be used as the name of a nested command for which the help message should be assembled.

  For example, the invocation `cli --help cmd` would throw the help of the `cmd` command, if it exists. If not, or if it does not have a help option, the argument may still be used as an option filter, if the `useFilter` attribute is set.

  The nested command may also enable filtering in its help option definition. For example, the invocation `cli --help cmd -f` would throw the help of the `cmd` command, filtered by the pattern `-f`.

### Patch Changes

- [#117](https://github.com/trulysimple/tsargp/pull/117) [`ad11fb7`](https://github.com/trulysimple/tsargp/commit/ad11fb72a571eae7bdbbd0e08831e7c136edf19f) Thanks [@disog](https://github.com/disog)! - The parsing methods now support characters escaped with `\` in raw command lines.

- [#119](https://github.com/trulysimple/tsargp/pull/119) [`52d1581`](https://github.com/trulysimple/tsargp/commit/52d1581760b489929c5a560632dae7d314964f5d) Thanks [@disog](https://github.com/disog)! - The parsing procedures now accept the `BUFFER` environment variable without its sibling `CURSOR` variable.

## 0.4.1

### Patch Changes

- [`2e9fce0`](https://github.com/trulysimple/tsargp/commit/2e9fce0c3a432e589a0db0359fb8ba581007344a) Thanks [@disog](https://github.com/disog)! - Fixed the readme

## 0.4.0

### Minor Changes

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - Added the `skipCount` attribute to function options to indicate the number of remaining command-line arguments to skip after returning from the execute callback.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - Added the `ConnectiveWords` enumeration to be used together with the `connectives` property of the validator configuration, in order to customize the formatting of option requirements.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - Removed the `parseDelimited` attribute in anticipation for a new and better feature yet to be implemented. This parsing callback was not really important, whereas the same effect can be achieved with the `parse` callback by modifying the previous option value.

  Improved the formatting of custom phrases for both error and help messages. Now they can contain multiple groups referencing the same phrase alternatives across groups. This also allowed the help item phrases to use specifiers for different value data types.

  Added a new kind of validation, `invalidNumericRange`, for the option's numeric range definition. Some other enumerators were merged into one that uses a phrase containing different format specifiers for each alternative.

  Refactored the `ul` enumeration into a constant that holds underline styles instead of underline colors (since it had just one color that was not strictly necessary).

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - Added new attributes for the boolean option: `truthNames`, `falsityNames` and `caseSensitive`. They can be used to configure how option parameters are converted to boolean.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - Added the `fallback` attribute for non-niladic options. It specifies a value that is used if the option is specified in the command-line without any parameter.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - Added the `paramCount` attribute to the function option, to specify the number of parameters that the option expects in the command-line. New enumerators, `invalidParamCount` and `variadicWithClusterLetter`, were added to `ErrorItem`, that are used by the validator when validating the new attribute. The formatter was updated to take this attribute into account when rendering the description of variadic options.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - Added a `breaks` property to help sections, to specify the number of line breaks to insert before a section. Added the `required` and `comment` properties to the usage section, to specify options that should be considered required in the usage, as well as to append a commentary to the usage, respectively. The demo was updated to include multiple usage sections.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - The `validate` method now returns a list of warnings. The validator was updated to detect naming inconsistencies in the option definitions and report them as warnings.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - Added the `useFilters` attribute to help option to allow remaining arguments to be used as option filters for the help message.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - The parser was refactored to more easily handle asynchronous callbacks. As a consequence, it no longer supports a synchronous parsing method.

  A new kind of validation, `invalidRequiredValue`, was implemented for the verification of required option values in the case of options that are either always required or have a default value.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - The parsing callbacks were refactored to accept a single parameter of type `ParseInfo`, which contains information about the current argument sequence in the parsing loop. The loop itself was refactored to accumulate a sequence of arguments that will be passed to the parsing callbacks as the option parameter(s). The `parseError` enumerator was removed from the `ErrorItem`, since it is no longer supported.

- [#101](https://github.com/trulysimple/tsargp/pull/101) [`5b0eb88`](https://github.com/trulysimple/tsargp/commit/5b0eb882daaf3798d5d2a7cc3c88e35542c72977) Thanks [@disog](https://github.com/disog)! - The `separator` attribute can now be used in conjunction with the `parse` callback. In this case, the callback will be called for each element split by the separator.

## 0.4.0-dev.3

### Minor Changes

- [#98](https://github.com/trulysimple/tsargp/pull/98) [`3501d5e`](https://github.com/trulysimple/tsargp/commit/3501d5e3ed877c0df7c1667f9c1e241d25853265) Thanks [@disog](https://github.com/disog)! - Added a `breaks` property to help sections, to specify the number of line breaks to insert before a section. Added the `required` and `comment` properties to the usage section, to specify options that should be considered required in the usage, as well as to append a commentary to the usage, respectively. The demo was updated to include multiple usage sections.

## 0.4.0-dev.2

### Minor Changes

- [#95](https://github.com/trulysimple/tsargp/pull/95) [`9d26e81`](https://github.com/trulysimple/tsargp/commit/9d26e81eabf3fb8ebe46c35e3419b7e1d5f46e3e) Thanks [@disog](https://github.com/disog)! - Added new attributes for the boolean option: `truthNames`, `falsityNames` and `caseSensitive`. They can be used to configure how option parameters are converted to boolean.

- [#96](https://github.com/trulysimple/tsargp/pull/96) [`464c113`](https://github.com/trulysimple/tsargp/commit/464c1136aa32767618eacfca685ff054b99d6b0b) Thanks [@disog](https://github.com/disog)! - Added the `paramCount` attribute to the function option, to specify the number of parameters that the option expects in the command-line. New enumerators, `invalidParamCount` and `variadicWithClusterLetter`, were added to `ErrorItem`, that are used by the validator when validating the new attribute. The formatter was updated to take this attribute into account when rendering the description of variadic options.

- [#92](https://github.com/trulysimple/tsargp/pull/92) [`34c6d5e`](https://github.com/trulysimple/tsargp/commit/34c6d5efa202bcc09213727f624f0f208409bd55) Thanks [@disog](https://github.com/disog)! - The parsing callbacks were refactored to accept a single parameter of type `ParseInfo`, which contains information about the current argument sequence in the parsing loop. The loop itself was refactored to accumulate a sequence of arguments that will be passed to the parsing callbacks as the option parameter(s). The `parseError` enumerator was removed from the `ErrorItem`, since it is no longer supported.

## 0.4.0-dev.1

### Minor Changes

- [#89](https://github.com/trulysimple/tsargp/pull/89) [`1b6b17a`](https://github.com/trulysimple/tsargp/commit/1b6b17a4f0aed26118f33f88a2e8fa36237969ba) Thanks [@disog](https://github.com/disog)! - Added the `ConnectiveWords` enumeration to be used together with the `connectives` property of the validator configuration, in order to customize the formatting of option requirements.

- [#81](https://github.com/trulysimple/tsargp/pull/81) [`8070da4`](https://github.com/trulysimple/tsargp/commit/8070da460bef3ad735cd638228283eaa71a1ba50) Thanks [@disog](https://github.com/disog)! - Removed the `parseDelimited` attribute in anticipation for a new and better feature yet to be implemented. This parsing callback was not really important, whereas the same effect can be achieved with the `parse` callback by modifying the previous option value.

  Improved the formatting of custom phrases for both error and help messages. Now they can contain multiple groups referencing the same phrase alternatives across groups. This also allowed the help item phrases to use specifiers for different value data types.

  Added a new kind of validation, `invalidNumericRange`, for the option's numeric range definition. Some other enumerators were merged into one that uses a phrase containing different format specifiers for each alternative.

  Refactored the `ul` enumeration into a constant that holds underline styles instead of underline colors (since it had just one color that was not strictly necessary).

- [#88](https://github.com/trulysimple/tsargp/pull/88) [`b46a609`](https://github.com/trulysimple/tsargp/commit/b46a609d116167496b7ddce2a1a21ef98cee47ba) Thanks [@disog](https://github.com/disog)! - Added the `fallback` attribute for non-niladic options. It specifies a value that is used if the option is specified in the command-line without any parameter.

- [#84](https://github.com/trulysimple/tsargp/pull/84) [`4c2587a`](https://github.com/trulysimple/tsargp/commit/4c2587a27142dd308549c8a788e66c9823ecb558) Thanks [@disog](https://github.com/disog)! - The parser was refactored to more easily handle asynchronous callbacks. As a consequence, it no longer supports a synchronous parsing method.

  A new kind of validation, `invalidRequiredValue`, was implemented for the verification of required option values in the case of options that are either always required or have a default value.

## 0.4.0-dev.0

### Minor Changes

- [#73](https://github.com/trulysimple/tsargp/pull/73) [`9e40f46`](https://github.com/trulysimple/tsargp/commit/9e40f469c8d9e4a6bbfb7f032451c7394a822adc) Thanks [@disog](https://github.com/disog)! - Added the `skipCount` attribute to function options to indicate the number of remaining command-line arguments to skip after returning from the execute callback.

- [#78](https://github.com/trulysimple/tsargp/pull/78) [`9ac4ba5`](https://github.com/trulysimple/tsargp/commit/9ac4ba593fde0e78648e2fbc15f6cb633cca2a0d) Thanks [@disog](https://github.com/disog)! - The `validate` method now returns a list of warnings. The validator was updated to detect naming inconsistencies in the option definitions and report them as warnings.

- [#74](https://github.com/trulysimple/tsargp/pull/74) [`489621b`](https://github.com/trulysimple/tsargp/commit/489621b62f019c56d7cce800bb728876dbcbf2dc) Thanks [@disog](https://github.com/disog)! - Added the `useFilters` attribute to help option to allow remaining arguments to be used as option filters for the help message.

- [#71](https://github.com/trulysimple/tsargp/pull/71) [`4647beb`](https://github.com/trulysimple/tsargp/commit/4647beb973cd89d04cf6fcf3ed90f60712ee5744) Thanks [@disog](https://github.com/disog)! - The `separator` attribute can now be used in conjunction with the `parse` callback. In this case, the callback will be called for each element split by the separator.

## 0.3.0

### Minor Changes

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added a new `envVar` attribute to options that have a value, to read the value from an environment variable. Also, function and command options now have the ability to define `default` values.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added text alignment settings for option parameter and description in the help message. Added a `rightAlign` property to terminal strings, that makes the wrapping procedure align text to the terminal's right boundary.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added a help format configuration named `align`, that can be used to select the alignment of option names in the help message.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - A new attribute called `requiredIf` was added to valued options, to indicate the option's conditional requirements. Similarly, a new enumerator was added to `HelpItem` to print this attribute in the help message. Both the parser and the formatter were updated to handle conditional option requirements.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added the `formatSections` method to the help formatter, that implements sections in the help message. Added the following properties to `HelpConfig`: `sections`, `styles` amd `misc`. Removed some attributes from the help option which are not needed anymore. (We will _not_ go through a deprecation process, since the library is under active development and not currently used by other packages.)

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added new classes to represent the various kinds of messages that the parser may return or throw from the parsing procedure, namely: help, version, error, warning and completion words. Accordingly, new methods were added to the parser class, that you can use to check for these messages. Here is a list of what was introduced in this change:

  - `TerminalMessage` - base class for other message types
  - `WarnMessage` - represents a warning message (e.g., for a deprecated option)
  - `CompletionMessage` - the list of completion words
  - `VersionMessage` - the version (currently, it's just a string)
  - `ArgumentParser.doParse` - the most flexible method to parse arguments
  - `ArgumentParser.tryParse` - a convenience method that catches any error before returning

  Removed the `OpaqueArgumentParser` and `CastToOptionValues` as they are not needed anymore. Instead,
  you can use `ArgumentParser` or `OptionValues` with no template argument.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added the `clusterLetters` attribute to valued options, to support the so called "short-options" style. Added the `shortStyle` configuration property to the parser configuration, to indicate that the first command-line argument is expected to be an option cluster. These two must be used in conjunction.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - `ParseConfig` has a new field called `progName` which specifies the program name used to update the process title. It defaults to the basename of the executing script (if no command is provided), or to the command name, in case a raw command-line string is provided.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - The demo example now has a `help` command that prints the help of another nested command (currently, only `hello`).

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - The package was refactored to remove unneeded exports, which reduced the footprint of the minified module.

### Patch Changes

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Refactored the `HelpConfig` to reuse the same object for configuring the help columns. Improved the wrapping procedure to emit all control sequences when `emitStyles` is true.

## 0.3.0-dev.4

### Minor Changes

- [#61](https://github.com/trulysimple/tsargp/pull/61) [`0a9ce4e`](https://github.com/trulysimple/tsargp/commit/0a9ce4e7f0e8a85e5641236282aac96609d584df) Thanks [@disog](https://github.com/disog)! - Added text alignment settings for option parameter and description in the help message. Added a `rightAlign` property to terminal strings, that makes the wrapping procedure align text to the terminal's right boundary.

- [#66](https://github.com/trulysimple/tsargp/pull/66) [`77b6bf0`](https://github.com/trulysimple/tsargp/commit/77b6bf03b222868d37b26716bd14f9834ab4293f) Thanks [@disog](https://github.com/disog)! - Added the `clusterLetters` attribute to valued options, to support the so called "short-options" style. Added the `shortStyle` configuration property to the parser configuration, to indicate that the first command-line argument is expected to be an option cluster. These two must be used in conjunction.

### Patch Changes

- [#64](https://github.com/trulysimple/tsargp/pull/64) [`94ddf59`](https://github.com/trulysimple/tsargp/commit/94ddf59ec36ccd231f3ea5adbd8024093ba26573) Thanks [@disog](https://github.com/disog)! - Refactored the `HelpConfig` to reuse the same object for configuring the help columns. Improved the wrapping procedure to emit all control sequences when `emitStyles` is true.

## 0.3.0-dev.3

### Minor Changes

- [#60](https://github.com/trulysimple/tsargp/pull/60) [`95736cf`](https://github.com/trulysimple/tsargp/commit/95736cfc3bc3b9d8c1396302674d58e482b56aa3) Thanks [@disog](https://github.com/disog)! - Added a help format configuration named `align`, that can be used to select the alignment of option names in the help message.

- [#53](https://github.com/trulysimple/tsargp/pull/53) [`df5d7a4`](https://github.com/trulysimple/tsargp/commit/df5d7a49fb7b97affcf87d63f02f558251cca787) Thanks [@disog](https://github.com/disog)! - Added the `formatSections` method to the help formatter, that implements sections in the help message. Added the following properties to `HelpConfig`: `sections`, `styles` amd `misc`. Removed some attributes from the help option which are not needed anymore. (We will _not_ go through a deprecation process, since the library is under active development and not currently used by other packages.)

## 0.3.0-dev.2

### Minor Changes

- [#49](https://github.com/trulysimple/tsargp/pull/49) [`4a76dc1`](https://github.com/trulysimple/tsargp/commit/4a76dc17b2c82d089284348918a54a5cd454e639) Thanks [@disog](https://github.com/disog)! - A new attribute called `requiredIf` was added to valued options, to indicate the option's conditional requirements. Similarly, a new enumerator was added to `HelpItem` to print this attribute in the help message. Both the parser and the formatter were updated to handle conditional option requirements.

## 0.3.0-dev.1

### Minor Changes

- [#48](https://github.com/trulysimple/tsargp/pull/48) [`4050cb9`](https://github.com/trulysimple/tsargp/commit/4050cb9bc20c6c9cbd46bf6ef099af50aee82f9b) Thanks [@disog](https://github.com/disog)! - Added new classes to represent the various kinds of messages that the parser may return or throw from the parsing procedure, namely: help, version, error, warning and completion words. Accordingly, new methods were added to the parser class, that you can use to check for these messages. Here is a list of what was introduced in this change:

  - `TerminalMessage` - base class for other message types
  - `WarnMessage` - represents a warning message (e.g., for a deprecated option)
  - `CompletionMessage` - the list of completion words
  - `VersionMessage` - the version (currently, it's just a string)
  - `ArgumentParser.doParse` - the most flexible method to parse arguments
  - `ArgumentParser.tryParse` - a convenience method that catches any error before returning

  Removed the `OpaqueArgumentParser` and `CastToOptionValues` as they are not needed anymore. Instead,
  you can use `ArgumentParser` or `OptionValues` with no template argument.

- [#45](https://github.com/trulysimple/tsargp/pull/45) [`889da8a`](https://github.com/trulysimple/tsargp/commit/889da8aa6e25e033a7992ac6975926cd62975e01) Thanks [@disog](https://github.com/disog)! - The package was refactored to remove unneeded exports, which reduced the footprint of the minified module.

## 0.3.0-dev.0

### Minor Changes

- [#42](https://github.com/trulysimple/tsargp/pull/42) [`c0fc66a`](https://github.com/trulysimple/tsargp/commit/c0fc66acce925875645c331a2ee060a669f28797) Thanks [@disog](https://github.com/disog)! - Added a new `envVar` attribute to options that have a value, to read the value from an environment variable. Also, function and command options now have the ability to define `default` values.

- [#33](https://github.com/trulysimple/tsargp/pull/33) [`f7cc353`](https://github.com/trulysimple/tsargp/commit/f7cc353204831d1a723d05c9309d5619f17d7649) Thanks [@disog](https://github.com/disog)! - `ParseConfig` has a new field called `progName` which specifies the program name used to update the process title. It defaults to the basename of the executing script (if no command is provided), or to the command name, in case a raw command-line string is provided.

- [#41](https://github.com/trulysimple/tsargp/pull/41) [`6acda27`](https://github.com/trulysimple/tsargp/commit/6acda27268390f8c1e9fb3ce7256a069c99b4f2e) Thanks [@disog](https://github.com/disog)! - The demo example now has a `help` command that prints the help of another nested command (currently, only `hello`).

## 0.2.9

### Patch Changes

- [#39](https://github.com/trulysimple/tsargp/pull/39) [`d0028a2`](https://github.com/trulysimple/tsargp/commit/d0028a253eff2cd61fe2b68cef43184e7b914a15) Thanks [@disog](https://github.com/disog)! - The datatype of a required option was fixed to be non-optional (i.e., it cannot be `undefined`).

## 0.2.8

### Patch Changes

- [#36](https://github.com/trulysimple/tsargp/pull/36) [`4fbbfaa`](https://github.com/trulysimple/tsargp/commit/4fbbfaab1a5faf7297696d47f34481bbf79a2356) Thanks [@disog](https://github.com/disog)! - The data type of an option with `enums` was fixed. Now it will have a union base type, as expected.

## 0.2.7

### Patch Changes

- [#30](https://github.com/trulysimple/tsargp/pull/30) [`e9d8c9b`](https://github.com/trulysimple/tsargp/commit/e9d8c9bcb4b464345689025e73cbc9a6019615e5) Thanks [@disog](https://github.com/disog)! - A new page was added in the project website for code documentation generated with [TypeDoc](https://typedoc.org/). It's called "API" and is served under the `api` subpath.

## 0.2.6

### Patch Changes

- [#26](https://github.com/trulysimple/tsargp/pull/26) [`e039ba2`](https://github.com/trulysimple/tsargp/commit/e039ba2aefa049ba18108cb793c2eef46acf1142) Thanks [@disog](https://github.com/disog)! - You can now set the `NO_COLOR` environment variable to _omit_ styles from error and help messages.
  You can also set `FORCE_COLOR` to _emit_ styles even when the output is being redirected.
