//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
export type { Style };

export { clearStyle, fg, bg, tf, ff, StyledString, isStyle, styleToString };

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
const clearStyle = '\x1b[0m';

/**
 * The list of available foreground colors.
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
 * The list of available background colors.
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
 * The list of available type faces.
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
  noFrame = '\x1b[54m',
  noEncircle = noFrame,
  noOverline = '\x1b[55m',
  superscript = '\x1b[73m',
  subscript = '\x1b[74m',
  noSuperscript = '\x1b[75m',
  noSubscript = noSuperscript,
}

/**
 * The list of available font families.
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
/**
 * A style for displaying text (on terminals that support it).
 */
type Style = Array<fg | bg | tf | ff | typeof clearStyle>;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements concatenation of strings with styles.
 */
class StyledString {
  readonly strings = new Array<string>();
  private lastStyle = '';

  get string(): string {
    return this.strings.join('');
  }

  get length(): number {
    return this.strings.reduce((sum, str) => sum + (isStyle(str) ? 0 : str.length), 0);
  }

  style(style: string): this {
    if (style && style != this.lastStyle) {
      this.strings.push(style);
      this.lastStyle = style;
    }
    return this;
  }

  append(...texts: Array<string>): this {
    this.strings.push(...texts);
    return this;
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
function styleToString(style: Style = []): string {
  return style.join('');
}

function isStyle(text: string): boolean {
  return text.startsWith('\x1b');
}
