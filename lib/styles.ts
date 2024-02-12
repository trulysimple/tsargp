//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
export type { Color, FgColor, BgColor, Style };

export { clearStyle, fg, bg, tf, ff, StyledString, isStyle, styleToString, fgColor, bgColor };

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * A special style that clears any previous style attributes.
 */
const clearStyle = '\x1b[0m';

/**
 * The list of predefined foreground colors.
 */
const enum fg {
  black = '\x1b[30m',
  red = '\x1b[31m',
  green = '\x1b[32m',
  yellow = '\x1b[33m',
  blue = '\x1b[34m',
  magenta = '\x1b[35m',
  cyan = '\x1b[36m',
  white = '\x1b[37m',
  default = '\x1b[39m',
  brightBlack = '\x1b[90m',
  brightRed = '\x1b[91m',
  brightGreen = '\x1b[92m',
  brightYellow = '\x1b[93m',
  brightBlue = '\x1b[94m',
  brightMagenta = '\x1b[95m',
  brightCyan = '\x1b[96m',
  brightWhite = '\x1b[97m',
}

/**
 * The list of predefined background colors.
 */
const enum bg {
  black = '\x1b[40m',
  red = '\x1b[41m',
  green = '\x1b[42m',
  yellow = '\x1b[43m',
  blue = '\x1b[44m',
  magenta = '\x1b[45m',
  cyan = '\x1b[46m',
  white = '\x1b[47m',
  default = '\x1b[49m',
  brightBlack = '\x1b[100m',
  brightRed = '\x1b[101m',
  brightGreen = '\x1b[102m',
  brightYellow = '\x1b[103m',
  brightBlue = '\x1b[104m',
  brightMagenta = '\x1b[105m',
  brightCyan = '\x1b[106m',
  brightWhite = '\x1b[107m',
}

/**
 * The list of predefined type faces.
 */
const enum tf {
  bold = '\x1b[1m',
  faint = '\x1b[2m',
  italic = '\x1b[3m',
  underline = '\x1b[4m',
  slowBlink = '\x1b[5m',
  rapidBlink = '\x1b[6m',
  invert = '\x1b[7m',
  conceal = '\x1b[8m',
  strike = '\x1b[9m',
  noBold = '\x1b[21m',
  noFaint = '\x1b[22m',
  noItalic = '\x1b[23m',
  noUnderline = '\x1b[24m',
  noBlink = '\x1b[25m',
  space = '\x1b[26m',
  noInvert = '\x1b[27m',
  noConceal = '\x1b[28m',
  noStrike = '\x1b[29m',
  noSpace = '\x1b[50m',
  frame = '\x1b[51m',
  encircle = '\x1b[52m',
  overline = '\x1b[53m',
  noFrameOrEncircle = '\x1b[54m',
  noOverline = '\x1b[55m',
  superscript = '\x1b[73m',
  subscript = '\x1b[74m',
  noSuperscriptOrSubscript = '\x1b[75m',
}

/**
 * The list of predefined font families.
 */
const enum ff {
  primary = '\x1b[10m',
  alternative1 = '\x1b[11m',
  alternative2 = '\x1b[12m',
  alternative3 = '\x1b[13m',
  alternative4 = '\x1b[14m',
  alternative5 = '\x1b[15m',
  alternative6 = '\x1b[16m',
  alternative7 = '\x1b[17m',
  alternative8 = '\x1b[18m',
  alternative9 = '\x1b[19m',
  gothic = '\x1b[20m',
}

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
type UpToFour = '0' | '1' | '2' | '3' | '4';
type Digit = UpToFour | '5' | '6' | '7' | '8' | '9';

/**
 * An 8-bit color.
 */
type Color =
  | Digit
  | `${Exclude<Digit, '0'>}${Digit}`
  | `1${Digit}${Digit}`
  | `2${UpToFour}${Digit}`
  | `25${UpToFour | '5'}`;

/**
 * An 8-bit foreground color.
 */
type FgColor = `\x1b[38;5;${Color}m`;

/**
 * An 8-bit background color.
 */
type BgColor = `\x1b[48;5;${Color}m`;

/**
 * A style for displaying text on the console.
 *
 * Originally this was just an array, but it was not strict enough (for example, a user could add
 * more that one font family, which is absurd).
 */
type Style = {
  /**
   * True to clear any previous style.
   */
  clear?: true;
  /**
   * The foreground color.
   */
  fg?: fg | FgColor;
  /**
   * The background color.
   */
  bg?: bg | BgColor;
  /**
   * The list of type faces.
   */
  tf?: Array<tf>;
  /**
   * The font family.
   */
  ff?: ff;
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements concatenation of strings with styles.
 */
class StyledString {
  private lastStyle = '';

  /**
   * The list of strings that have been appended (styles and text).
   */
  readonly strings = new Array<string>();

  /**
   * @returns The concatenation of all strings, including styles.
   */
  get string(): string {
    return this.strings.join('');
  }

  /**
   * @returns The length of the concatenated string, excluding the lengths of styles.
   */
  get length(): number {
    return this.strings.reduce((sum, str) => sum + (isStyle(str) ? 0 : str.length), 0);
  }

  /**
   * Appends a style to the list of strings.
   * @param style The style string. Should be the result of calling {@link styleToString}
   * @returns This
   */
  style(style: string): this {
    if (style && style != this.lastStyle) {
      this.strings.push(style);
      this.lastStyle = style;
    }
    return this;
  }

  /**
   * Appends texts to the list of strings.
   * @param texts The texts to be appended. Should not contain any style.
   * @returns This
   */
  append(...texts: Array<string>): this {
    this.strings.push(...texts);
    return this;
  }

  /**
   * Appends a styled string to the list of strings.
   * @param str The styled string to be appended.
   * @returns This
   */
  appendStyled(str: StyledString): this {
    this.strings.push(...str.strings);
    this.lastStyle = str.lastStyle;
    return this;
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Converts a style to a string, for use with {@link StyledString}
 * @param style The style object
 * @returns The style string
 */
function styleToString(style: Style = {}): string {
  return [style.clear ? clearStyle : '', style.fg, style.bg, ...(style.tf ?? []), style.ff].join(
    '',
  );
}

/**
 * Tests if a string is a style.
 * @param text The text to be checked
 * @returns True if the text is a style string
 */
function isStyle(text: string): boolean {
  return text.startsWith('\x1b');
}

/**
 * Gets a foreground color from an 8-bit color.
 * @param color The 8-bit color
 * @returns The foreground color
 */
function fgColor(color: Color): FgColor {
  return `\x1b[38;5;${color}m`;
}

/**
 * Gets a background color from an 8-bit color.
 * @param color The 8-bit color
 * @returns The background color
 */
function bgColor(color: Color): BgColor {
  return `\x1b[48;5;${color}m`;
}
