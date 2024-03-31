# @trulysimple/tsargp-docs

## 0.3.0-dev.1

### Minor Changes

- [#89](https://github.com/trulysimple/tsargp/pull/89) [`1b6b17a`](https://github.com/trulysimple/tsargp/commit/1b6b17a4f0aed26118f33f88a2e8fa36237969ba) Thanks [@disog](https://github.com/disog)! - Added a sub-section called "Connective words" in the Validator page, to document the new `ConnectiveWords` enumeration.

- [#88](https://github.com/trulysimple/tsargp/pull/88) [`b46a609`](https://github.com/trulysimple/tsargp/commit/b46a609d116167496b7ddce2a1a21ef98cee47ba) Thanks [@disog](https://github.com/disog)! - Documented the new `fallback` attribute in the Options page.

- [#84](https://github.com/trulysimple/tsargp/pull/84) [`4c2587a`](https://github.com/trulysimple/tsargp/commit/4c2587a27142dd308549c8a788e66c9823ecb558) Thanks [@disog](https://github.com/disog)! - A whole section about asynchronous parsing was removed from the Parser page, according to changes made in the code. The Validator page was updated to document a new kind of validation, namely, `invalidRequiredValue`.

- [#81](https://github.com/trulysimple/tsargp/pull/81) [`8070da4`](https://github.com/trulysimple/tsargp/commit/8070da460bef3ad735cd638228283eaa71a1ba50) Thanks [@disog](https://github.com/disog)! - Removed the `parseDelimited` attribute from the "Parameter attributes" in the Options page, to reflect changes in code. Moved some text about custom phrases and format specifiers from both Formatter and Validator pages to the Styles page, where the information on this subject is now centralized.

  Updated the "Error items" section of the Validator page, to reflect changes in code. In the same page, the "Enums validation" section was renamed to "Constraints validation", where the new validation rule for numeric ranges was documented.

  Updated the "Help phrases" of the Formatter page to reflect changes in code. Also added a table of format specifiers to document the available phrase specifiers for help items.

## 0.3.0-dev.0

### Minor Changes

- [#78](https://github.com/trulysimple/tsargp/pull/78) [`9ac4ba5`](https://github.com/trulysimple/tsargp/commit/9ac4ba593fde0e78648e2fbc15f6cb633cca2a0d) Thanks [@disog](https://github.com/disog)! - The Validator page was updated to document the new behaviour of the `validate` method, namely, that it returns validation warnings as a result. The "Names validation" section was updated to document the detection of naming inconsistencies. The Playground page was updated to report validation warnings when validating the input source.

### Patch Changes

- [#74](https://github.com/trulysimple/tsargp/pull/74) [`489621b`](https://github.com/trulysimple/tsargp/commit/489621b62f019c56d7cce800bb728876dbcbf2dc) Thanks [@disog](https://github.com/disog)! - Updated the Options page to document the new `useFilters` attribute for help options. Also added a tip in the Demo page for users to try out the new feature.

- [#73](https://github.com/trulysimple/tsargp/pull/73) [`9e40f46`](https://github.com/trulysimple/tsargp/commit/9e40f469c8d9e4a6bbfb7f032451c7394a822adc) Thanks [@disog](https://github.com/disog)! - Documented the new `skipCount` attribute for function options in the Options page.

- [#71](https://github.com/trulysimple/tsargp/pull/71) [`4647beb`](https://github.com/trulysimple/tsargp/commit/4647beb973cd89d04cf6fcf3ed90f60712ee5744) Thanks [@disog](https://github.com/disog)! - The Options page was updated to document the possibility of specifying a `parse` callback in conjunction with a `separator`. The Parser page was updated with more details about the behavior of the custom parsing callbacks.

## 0.2.0

### Minor Changes

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - The Options page was updated to document the new `requiredIf` attribute for valued options. An example was added in the respective section to explain the difference between this attribute and the traditional `requires`.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added a new section called "Terminal messages" in the Styles page to describe the various kinds of messages produced by the library. Updated the Parser page to document the new parsing methods that can be used to check for these messages. Also updated the Validator page to document the new `deprecatedOption` warning.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added a new guide page called "Help", to describe how to implement different help mechanisms for a CLI application.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Updated the Formatter page to document the new alignment settings for option parameters and description in the help message. Added a section in the Styles page for the new right-alignment feature of the wrapping procedure.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Updated the Formatter page to document the new `formatSections` method, as well as the new configuration properties: `sections`, `styles` amd `misc`. Updated the help option section in the Options page, to reflect the changes to this option's attributes.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - The Parser page was updated to document the new `shortStyle` configuration property. A new section called `Miscellaneous attributes` was added to the Options page, under which the `clusterLetters` attribute was documented. The `envVar` attribute was moved to this section.

### Patch Changes

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - Added missing source links in the API documentation generated with TypeDoc.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - The Parser page was updated to document the new `progName` field of the parse configuration, as well as add a new section to explain how the process title is updated by the parser.

- [#67](https://github.com/trulysimple/tsargp/pull/67) [`a2ee717`](https://github.com/trulysimple/tsargp/commit/a2ee717470f550e93cb9a0653df41aafceff5748) Thanks [@disog](https://github.com/disog)! - The documentation was updated to include the new `envVar` attribute, as well as to group attributes that are shared by valued options into a new section called "Value attributes".

## 0.2.0-dev.4

### Minor Changes

- [#61](https://github.com/trulysimple/tsargp/pull/61) [`0a9ce4e`](https://github.com/trulysimple/tsargp/commit/0a9ce4e7f0e8a85e5641236282aac96609d584df) Thanks [@disog](https://github.com/disog)! - Updated the Formatter page to document the new alignment settings for option parameters and description in the help message. Added a section in the Styles page for the new right-alignment feature of the wrapping procedure.

- [#66](https://github.com/trulysimple/tsargp/pull/66) [`77b6bf0`](https://github.com/trulysimple/tsargp/commit/77b6bf03b222868d37b26716bd14f9834ab4293f) Thanks [@disog](https://github.com/disog)! - The Parser page was updated to document the new `shortStyle` configuration property. A new section called `Miscellaneous attributes` was added to the Options page, under which the `clusterLetters` attribute was documented. The `envVar` attribute was moved to this section.

## 0.2.0-dev.3

### Minor Changes

- [#53](https://github.com/trulysimple/tsargp/pull/53) [`df5d7a4`](https://github.com/trulysimple/tsargp/commit/df5d7a49fb7b97affcf87d63f02f558251cca787) Thanks [@disog](https://github.com/disog)! - Updated the Formatter page to document the new `formatSections` method, as well as the new configuration properties: `sections`, `styles` amd `misc`. Updated the help option section in the Options page, to reflect the changes to this option's attributes.

### Patch Changes

- [#57](https://github.com/trulysimple/tsargp/pull/57) [`3cfbf64`](https://github.com/trulysimple/tsargp/commit/3cfbf6401962d66ac26035b6b77902c9e2a10722) Thanks [@disog](https://github.com/disog)! - Added missing source links in the API documentation generated with TypeDoc.

## 0.2.0-dev.2

### Minor Changes

- [#49](https://github.com/trulysimple/tsargp/pull/49) [`4a76dc1`](https://github.com/trulysimple/tsargp/commit/4a76dc17b2c82d089284348918a54a5cd454e639) Thanks [@disog](https://github.com/disog)! - The Options page was updated to document the new `requiredIf` attribute for valued options. An example was added in the respective section to explain the difference between this attribute and the traditional `requires`.

## 0.2.0-dev.1

### Minor Changes

- [#48](https://github.com/trulysimple/tsargp/pull/48) [`4050cb9`](https://github.com/trulysimple/tsargp/commit/4050cb9bc20c6c9cbd46bf6ef099af50aee82f9b) Thanks [@disog](https://github.com/disog)! - Added a new section called "Terminal messages" in the Styles page to describe the various kinds of messages produced by the library. Updated the Parser page to document the new parsing methods that can be used to check for these messages. Also updated the Validator page to document the new `deprecatedOption` warning.

## 0.2.0-dev.0

### Minor Changes

- [#41](https://github.com/trulysimple/tsargp/pull/41) [`6acda27`](https://github.com/trulysimple/tsargp/commit/6acda27268390f8c1e9fb3ce7256a069c99b4f2e) Thanks [@disog](https://github.com/disog)! - Added a new guide page called "Help", to describe how to implement different help mechanisms for a CLI application.

### Patch Changes

- [#33](https://github.com/trulysimple/tsargp/pull/33) [`f7cc353`](https://github.com/trulysimple/tsargp/commit/f7cc353204831d1a723d05c9309d5619f17d7649) Thanks [@disog](https://github.com/disog)! - The Parser page was updated to document the new `progName` field of the parse configuration, as well as add a new section to explain how the process title is updated by the parser.

- [#42](https://github.com/trulysimple/tsargp/pull/42) [`c0fc66a`](https://github.com/trulysimple/tsargp/commit/c0fc66acce925875645c331a2ee060a669f28797) Thanks [@disog](https://github.com/disog)! - The documentation was updated to include the new `envVar` attribute, as well as to group attributes that are shared by valued options into a new section called "Value attributes".

## 0.1.47

### Patch Changes

- [#30](https://github.com/trulysimple/tsargp/pull/30) [`e9d8c9b`](https://github.com/trulysimple/tsargp/commit/e9d8c9bcb4b464345689025e73cbc9a6019615e5) Thanks [@disog](https://github.com/disog)! - A new page was added in the project website for code documentation generated with [TypeDoc](https://typedoc.org/). It's called "API" and is served under the `api` subpath.

## 0.1.46

### Patch Changes

- [#29](https://github.com/trulysimple/tsargp/pull/29) [`065bc1b`](https://github.com/trulysimple/tsargp/commit/065bc1b6ec941a5ca3a9b5df238339fa76b43a57) Thanks [@disog](https://github.com/disog)! - You can now set environment variables in the demo (e.g., `NO_COLOR=1`). This works even when performing completion. One caveat though: if you set variables inline with a command (e.g., `VAR1=1 VAR2=2 <cmd> ...`) they will persist through future invocations of any command. To reset variables, use the syntax `VAR=`.

## 0.1.45

### Patch Changes

- [#4](https://github.com/trulysimple/tsargp/pull/4) [`639c040`](https://github.com/trulysimple/tsargp/commit/639c0400b6031c0e9c20ddbb4ff5c850fac64f86) Thanks [@disog](https://github.com/disog)! - The "Report Bug" button in the playground now uses the "Bug Report" issue template.
