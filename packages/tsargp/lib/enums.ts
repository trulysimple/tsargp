//--------------------------------------------------------------------------------------------------
// Exports - NOTE: some enumerations are abbreviated for ease of use in client code.
//--------------------------------------------------------------------------------------------------
export { ControlSequence as cs, TypeFace as tf, Foreground as fg, Background as bg };

//--------------------------------------------------------------------------------------------------
// Constants - NOTE: please add new enumerators at the _end_ of the enumeration.
//--------------------------------------------------------------------------------------------------
/**
 * The kind of items that can be thrown as error messages.
 */
export const enum ErrorItem {
  /**
   * Raised by the parser when an option parameter fails to be parsed, with possible option name
   * suggestions.
   */
  parseError,
  /**
   * Raised by the parser when an option name is not found, with possible option name suggestions.
   */
  unknownOption,
  /**
   * Raised by the parser when an option requirement is not satisfied.
   */
  unsatisfiedRequirement,
  /**
   * Raised by the parser when an option that is always required was not specified.
   */
  missingRequiredOption,
  /**
   * Raised by the parser when an option parameter is expected but was not specified.
   */
  missingParameter,
  /**
   * Raised by the parser when it fails to find a "package.json" file when resolving the version.
   */
  missingPackageJson,
  /**
   * Raised by the parser when either a niladic option or a positional marker is specified with an
   * inline value.
   */
  disallowedInlineValue,
  /**
   * Raised by the validator when a positional option has an empty positional marker.
   */
  emptyPositionalMarker,
  /**
   * Raised by the validator when a non-positional option has no name.
   */
  unnamedOption,
  /**
   * Raised by the validator when an option has an invalid name.
   */
  invalidOptionName,
  /**
   * Raised by the validator when a version option has an empty version string.
   */
  emptyVersionDefinition,
  /**
   * Raised by the validator when an option references itself in a requirement.
   */
  invalidSelfRequirement,
  /**
   * Raised by the validator when an option references an unknown option in a requirement.
   */
  unknownRequiredOption,
  /**
   * Raised by the validator when an option references either a non-valued option or an option with
   * unknown values in a requirement.
   */
  invalidRequiredOption,
  /**
   * Raised by the validator when an option uses a nullish value in a requirement that references an
   * option that is always required.
   */
  invalidRequiredValue,
  /**
   * Raised by the validator when an option uses a value of incompatible data type in a requirement.
   */
  incompatibleRequiredValue,
  /**
   * Raised by the validator when an option has a zero-length enumeration array.
   */
  emptyEnumsDefinition,
  /**
   * Raised by the validator when an option has a duplicate name.
   */
  duplicateOptionName,
  /**
   * Raised by the validator when there are two or more positional options.
   */
  duplicatePositionalOption,
  /**
   * Raised by the validator when a string or number enumeration constraint has duplicate values.
   */
  duplicateEnumValue,
  /**
   * Raised by both the parser and validator when a value fails to satisfy either a string or a
   * number enumeration constraint.
   */
  enumsConstraintViolation,
  /**
   * Raised by both the parser and validator when a value fails to satisfy a string regex constraint.
   */
  regexConstraintViolation,
  /**
   * Raised by both the parser and validator when a value fails to satisfy a number range constraint.
   */
  rangeConstraintViolation,
  /**
   * Raised by both the parser and validator when a value fails to satisfy an array limit constraint.
   */
  limitConstraintViolation,
  /**
   * Warning produced by the parser when a deprecated option is specified on the command-line.
   */
  deprecatedOption,
  /**
   * Raised by the parser when a conditional option requirement is not satisfied.
   */
  unsatisfiedCondRequirement,
  /**
   * Raised by the validator when an option has a duplicate cluster letter.
   */
  duplicateClusterLetter,
  /**
   * Raised by the parser when either a variadic array option or a command option is specified in
   * the middle of a cluster argument.
   */
  invalidClusterOption,
  /**
   * Raised by the validator when an option has an invalid cluster letter.
   */
  invalidClusterLetter,
  /**
   * Warning produced by the validator when an option name is too similar to other names.
   */
  tooSimilarOptionNames,
  /**
   * Warning produced by the validator when a name slot contains names with different naming
   * conventions.
   */
  mixedNamingConvention,
  /**
   * Raised by the validator when an option has an invalid numeric range.
   */
  invalidNumericRange,
}

/**
 * The kind of items that can be shown in the option description.
 */
export const enum HelpItem {
  /**
   * The option synopsis.
   */
  synopsis,
  /**
   * The negation names of a flag option, if any.
   */
  negation,
  /**
   * The element delimiter of an array option, if enabled.
   */
  separator,
  /**
   * Reports if an array option accepts multiple parameters.
   */
  variadic,
  /**
   * Reports if an option accepts positional arguments.
   */
  positional,
  /**
   * Reports if an array option can be specified multiple times.
   */
  append,
  /**
   * Reports if string parameters will be trimmed (have leading and trailing whitespace removed).
   */
  trim,
  /**
   * The kind of case-conversion applied to string parameters, if enabled.
   */
  case,
  /**
   * The kind of math conversion applied to number parameters, if enabled.
   */
  conv,
  /**
   * The enumerated values that the option accepts as parameters, if any.
   */
  enums,
  /**
   * The regular expression that string parameters should match, if enabled.
   */
  regex,
  /**
   * The numeric range that number parameters should be within, if enabled.
   */
  range,
  /**
   * Reports if duplicate elements will be removed from an array option value.
   */
  unique,
  /**
   * The element count limit of an array option, if enabled.
   */
  limit,
  /**
   * The option's requirements, if any.
   */
  requires,
  /**
   * Reports if the option is always required.
   */
  required,
  /**
   * The option's default value, if any.
   */
  default,
  /**
   * Reports if the option is deprecated, and why.
   */
  deprecated,
  /**
   * The external resource reference, if any.
   */
  link,
  /**
   * The option's environment variable, if any.
   */
  envVar,
  /**
   * The option's conditional requirements, if any.
   */
  requiredIf,
  /**
   * The option's cluster letters, if any.
   */
  clusterLetters,
}

/**
 * A control sequence introducer command.
 * @see https://xtermjs.org/docs/api/vtfeatures/#csi
 */
const enum ControlSequence {
  /**
   * Cursor Up. Move cursor Ps times up (default=1).
   */
  cuu = 'A',
  /**
   * Cursor Down. Move cursor Ps times down (default=1).
   */
  cud = 'B',
  /**
   * Cursor Forward. Move cursor Ps times forward (default=1).
   */
  cuf = 'C',
  /**
   * Cursor Backward. Move cursor Ps times backward (default=1).
   */
  cub = 'D',
  /**
   * Cursor Next Line. Move cursor Ps times down (default=1) and to the first column.
   */
  cnl = 'E',
  /**
   * Cursor Previous Line. Move cursor Ps times up (default=1) and to the first column.
   */
  cpl = 'F',
  /**
   * Cursor Horizontal Absolute. Move cursor to Ps-th column of the active row (default=1).
   */
  cha = 'G',
  /**
   * Cursor Horizontal Tabulation. Move cursor Ps times tabs forward (default=1).
   */
  cht = 'I',
  /**
   * Cursor Backward Tabulation. Move cursor Ps tabs backward (default=1).
   */
  cbt = 'Z',
  /**
   * Vertical Position Absolute. Move cursor to Ps-th row (default=1).
   */
  vpa = 'd',
  /**
   * Vertical Position Relative. Move cursor Ps times down (default=1).
   */
  vpr = 'e',
  /**
   * Cursor Position. Set cursor to position [Ps, Ps] (default = [1, 1]).
   */
  cup = 'H',
  /**
   * Erase In Display. Erase various parts of the viewport.
   */
  ed = 'J',
  /**
   * Erase In Line. Erase various parts of the active row.
   */
  el = 'K',
  /**
   * Insert Lines. Insert Ps blank lines at active row (default=1).
   */
  il = 'L',
  /**
   * Delete Lines. Delete Ps lines at active row (default=1).
   */
  dl = 'M',
  /**
   * Insert Characters. Insert Ps (blank) characters (default = 1).
   */
  ich = '@',
  /**
   * Delete Characters. Delete Ps characters (default=1).
   */
  dch = 'P',
  /**
   * Erase Characters. Erase Ps characters from current cursor position to the right (default=1).
   */
  ech = 'X',
  /**
   * Repeat Preceding Character. Repeat preceding character Ps times (default=1).
   */
  rch = 'b',
  /**
   * Tab Clear. Clear tab stops at current position (0) or all (3) (default=0).
   */
  tbc = 'g',
  /**
   * Insert Columns. Insert Ps columns at cursor position.
   */
  icl = "'}",
  /**
   * Delete Columns. Delete Ps columns at cursor position.
   */
  dcl = "'~",
  /**
   * Scroll Left. Scroll viewport Ps times to the left.
   */
  sl = 'SP@',
  /**
   * Scroll Right. Scroll viewport Ps times to the right.
   */
  sr = 'SPA',
  /**
   * Scroll Up. Scroll Ps lines up (default=1).
   */
  su = 'S',
  /**
   * Scroll Down. Scroll Ps lines down (default=1).
   */
  sd = 'T',
  /**
   * Select Graphic Rendition. Set/Reset various text attributes.
   */
  sgr = 'm',
  /**
   * Set Top and Bottom Margins. Set top and bottom margins of the viewport [top;bottom] (default =
   * viewport size).
   */
  tbm = 'r',
  /**
   * Set Mode. Set various terminal modes.
   */
  sm = 'h',
  /**
   * Reset Mode. Reset various terminal attributes.
   */
  rm = 'l',
  /**
   * Device Status Report. Request cursor position (CPR) with Ps = 6.
   */
  dsr = 'n',
  /**
   * Soft Terminal Reset. Reset several terminal attributes to initial state.
   */
  str = '!p',
  /**
   * Set Cursor Style.
   */
  scs = 'SPq',
  /**
   * Save Cursor. Save cursor position, charmap and text attributes.
   */
  scp = 's',
  /**
   * Restore Cursor. Restore cursor position, charmap and text attributes.
   */
  rcp = 'u',
}

/**
 * A predefined text type face.
 */
const enum TypeFace {
  /**
   * Reset or normal. Resets any other preceding SGR attribute.
   */
  clear,
  /**
   * Bold or increased intensity.
   */
  bold,
  /**
   * Faint, decreased intensity, or dim.
   */
  faint,
  /**
   * Italic.
   */
  italic,
  /**
   * Underlined.
   */
  underlined,
  /**
   * Slowly blinking.
   */
  slowlyBlinking,
  /**
   * Rapidly blinking.
   */
  rapidlyBlinking,
  /**
   * Reverse video or inverse. Flips foreground and background color.
   */
  inverse,
  /**
   * Invisible, concealed or hidden.
   */
  invisible,
  /**
   * Crossed-out or strikethrough.
   */
  crossedOut,
  /**
   * Primary font.
   */
  primaryFont,
  /**
   * Alternative font 1.
   */
  alternative1,
  /**
   * Alternative font 2.
   */
  alternative2,
  /**
   * Alternative font 3.
   */
  alternative3,
  /**
   * Alternative font 4.
   */
  alternative4,
  /**
   * Alternative font 5.
   */
  alternative5,
  /**
   * Alternative font 6.
   */
  alternative6,
  /**
   * Alternative font 7.
   */
  alternative7,
  /**
   * Alternative font 8.
   */
  alternative8,
  /**
   * Alternative font 9.
   */
  alternative9,
  /**
   * Black-letter font.
   */
  fraktur,
  /**
   * Doubly underlined.
   */
  doublyUnderlined,
  /**
   * Normal intensity (neither bold nor faint).
   */
  notBoldOrFaint,
  /**
   * Regular face (neither italic nor black-letter).
   */
  notItalicNorFraktur,
  /**
   * Not underlined.
   */
  notUnderlined,
  /**
   * Steady (not blinking).
   */
  notBlinking,
  /**
   * Proportional spacing.
   */
  proportionalSpacing,
  /**
   * Positive (not inverse).
   */
  notInverse,
  /**
   * Visible (reveal, or not hidden).
   */
  notInvisible,
  /**
   * Not crossed out (no strikethrough).
   */
  notCrossedOut,
  /**
   * Disable proportional spacing.
   */
  notProportionalSpacing = 50,
  /**
   * Framed.
   */
  framed,
  /**
   * Encircled.
   */
  encircled,
  /**
   * Overlined
   */
  overlined,
  /**
   * Neither framed nor encircled
   */
  notFramedOrEncircled,
  /**
   * Not overlined.
   */
  notOverlined,
  /**
   * Ideogram underline or right side line.
   */
  ideogramUnderline = 60,
  /**
   * Ideogram double underline, or double line on the right side.
   */
  ideogramDoubleUnderline,
  /**
   * Ideogram overline or left side line.
   */
  ideogramOverline,
  /**
   * Ideogram double overline, or double line on the left side.
   */
  ideogramDoubleOverline,
  /**
   * Ideogram stress marking.
   */
  ideogramStressMarking,
  /**
   * No ideogram attributes.
   */
  noIdeogram,
  /**
   * Superscript.
   */
  superscript = 73,
  /**
   * Subscript.
   */
  subscript,
  /**
   * Neither superscript nor subscript.
   */
  notSuperscriptOrSubscript,
}

/**
 * A predefined text foreground color.
 */
const enum Foreground {
  black = 30,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  default = 39,
  brightBlack = 90,
  brightRed,
  brightGreen,
  brightYellow,
  brightBlue,
  brightMagenta,
  brightCyan,
  brightWhite,
}

/**
 * A predefined text background color.
 */
const enum Background {
  black = 40,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  default = 49,
  brightBlack = 100,
  brightRed,
  brightGreen,
  brightYellow,
  brightBlue,
  brightMagenta,
  brightCyan,
  brightWhite,
}
