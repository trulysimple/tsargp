//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
export type { Attr, Color, FgColor, BgColor, Style, DisplayAttr };

export { StyledString, sgr, fg, bg, isStyle };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
type UpToFour = '0' | '1' | '2' | '3' | '4';
type UpToSeven = UpToFour | '5' | '6' | '7';
type Digit = UpToSeven | '8' | '9';

/**
 * A common display attribute.
 */
type Attr = Digit | `${Exclude<Digit, '0'>}${Digit}` | `10${UpToSeven}`;

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
type FgColor = `38;5;${Color}`;

/**
 * An 8-bit background color.
 */
type BgColor = `48;5;${Color}`;

/**
 * A display attribute for use with SGR.
 */
type DisplayAttr = Attr | FgColor | BgColor;

/**
 * A style is an SGR control sequence.
 */
type Style = `\x1b[${string}m`;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements concatenation of strings with styles.
 */
class StyledString {
  private firstStyleIndex: number | undefined;
  private lastStyle: Style | undefined;
  maxWordLen = 0;
  length = 0;

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
   * Appends a style to the list of strings.
   * @param style The style string
   * @returns This
   */
  style(style: Style): this {
    if (style != this.lastStyle) {
      const index = this.strings.push(style);
      this.lastStyle = style;
      if (this.firstStyleIndex == undefined) {
        this.firstStyleIndex = index - 1;
      }
    }
    return this;
  }

  /**
   * Appends texts to the list of strings.
   * @param texts The texts to be appended. Should not contain any style.
   * @returns This
   */
  push(...texts: Array<string>): this {
    this.strings.push(...texts);
    const lengths = texts.map((str) => str.length);
    this.length += lengths.reduce((acc, len) => acc + len);
    this.maxWordLen = Math.max(this.maxWordLen, ...lengths);
    return this;
  }

  /**
   * Appends a styled string to the list of strings.
   * @param text The styled string to be appended.
   * @returns This
   */
  pushStyled(text: StyledString): this {
    if (
      text.firstStyleIndex === undefined ||
      text.strings[text.firstStyleIndex] != this.lastStyle
    ) {
      this.strings.push(...text.strings);
    } else {
      this.strings.push(
        ...text.strings.slice(0, text.firstStyleIndex),
        ...text.strings.slice(text.firstStyleIndex + 1),
      );
    }
    if (text.lastStyle) {
      this.lastStyle = text.lastStyle;
    }
    this.length += text.length;
    if (text.maxWordLen > this.maxWordLen) {
      this.maxWordLen = text.maxWordLen;
    }
    return this;
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Tests if a string is a style.
 * @param text The text to be checked
 * @returns True if the text is a style
 */
function isStyle(text: string): text is Style {
  return text.startsWith('\x1b');
}

/**
 * Gets a control sequence with SGR parameters.
 * @param attrs The display attributes
 * @returns The control sequence
 */
function sgr(...attrs: Array<DisplayAttr>): Style {
  return `\x1b[${attrs.join(';')}m`;
}

/**
 * Gets a foreground color from an 8-bit color.
 * @param color The 8-bit color
 * @returns The foreground color
 */
function fg(color: Color): FgColor {
  return `38;5;${color}`;
}

/**
 * Gets a background color from an 8-bit color.
 * @param color The 8-bit color
 * @returns The background color
 */
function bg(color: Color): BgColor {
  return `48;5;${color}`;
}
