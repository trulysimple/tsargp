//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
export type {
  FgColor,
  BgColor,
  UlColor,
  StyleAttr,
  Move,
  MoveTo,
  Edit,
  Scroll,
  Style,
  Margin,
  Sequence,
};

export {
  TerminalString,
  ErrorMessage,
  HelpMessage,
  MoveCommand as mv,
  EditCommand as ed,
  ScrollCommand as sc,
  MarginCommand as mg,
  TypeFace as tf,
  Foreground as fg,
  Background as bg,
  Underline as ul,
  foreground as fg8,
  background as bg8,
  underline as ul8,
  move,
  moveTo,
  edit,
  scroll,
  style,
  margin,
};

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * A single-parameter cursor movement command.
 */
const enum MoveCommand {
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
}

/**
 * A two-parameter cursor movement command.
 */
const enum MoveToCommand {
  /**
   * Cursor Position. Set cursor to position [Ps, Ps] (default = [1, 1]).
   */
  cup = 'H',
}

/**
 * A single-parameter edit command.
 */
const enum EditCommand {
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
}

/**
 * A single-parameter scroll command.
 */
const enum ScrollCommand {
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
}

/**
 * A multi-parameter text style command.
 */
const enum StyleCommand {
  /**
   * Select Graphic Rendition. Set/Reset various text attributes.
   */
  sgr = 'm',
}

/**
 * A two-parameter margin command.
 */
const enum MarginCommand {
  /**
   * Set Top and Bottom Margins. Set top and bottom margins of the viewport [top;bottom] (default =
   * viewport size).
   */
  tbm = 'r',
}

/**
 * A miscellaneous command.
 */
const enum MiscCommand {
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
   * Primary (default) font.
   */
  primary,
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
   * Black-letter font (Fraktur/Gothic).
   */
  gothic,
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
  notItalic,
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

/**
 * A predefined text underline color.
 */
const enum Underline {
  default = 59,
}

/**
 * A set of regular expressions for terminal strings.
 */
const regex = {
  para: /(?:[ \t]*\r?\n){2,}/,
  item: /^[ \t]*(-|\*|\d+\.) /m,
  punct: /[.,:;!?]$/,
  word: /\s+/,
  spec: /(%[a-z][0-9]?)/,
  // eslint-disable-next-line no-control-regex
  styles: /(?:\x9b[\d;]+m)+/g,
};

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * A control sequence introducer command. It is divided into subgroups for convenience.
 */
type Command =
  | MoveCommand
  | MoveToCommand
  | EditCommand
  | ScrollCommand
  | StyleCommand
  | MarginCommand
  | MiscCommand;

/**
 * A generic control sequence introducer string.
 * @template P The type of the sequence parameter
 * @template C The type of the sequence command
 */
type CSI<P extends string | number, C extends Command> = `\x9b${P}${C}`;

/**
 * A single-parameter cursor movement sequence.
 */
type Move = CSI<number, MoveCommand>;

/**
 * A two-parameter cursor movement sequence.
 */
type MoveTo = CSI<`${number};${number}`, MoveToCommand>;

/**
 * A single-parameter edit sequence.
 */
type Edit = CSI<number, EditCommand>;

/**
 * A single-parameter scroll sequence.
 */
type Scroll = CSI<number, ScrollCommand>;

/**
 * A multi-parameter text style sequence.
 */
type Style = CSI<string, StyleCommand> | '';

/**
 * A two-parameter margin sequence.
 */
type Margin = CSI<`${number};${number}`, MarginCommand>;

/**
 * A miscellaneous sequence. For completeness only, but not currently used.
 */
type Misc =
  | CSI<string, MiscCommand.sm | MiscCommand.rm>
  | CSI<number, MiscCommand.dsr | MiscCommand.scs>
  | CSI<'', MiscCommand.str | MiscCommand.scp | MiscCommand.rcp>;

/**
 * A control sequence introducer sequence.
 * @see https://xtermjs.org/docs/api/vtfeatures/#csi
 */
type Sequence = Move | MoveTo | Edit | Scroll | Style | Margin | Misc;

/**
 * A helper type to enumerate numbers.
 * @template N The type of last enumerated number
 */
type Enumerate<N extends number, Acc extends Array<number> = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

/**
 * An 8-bit decimal number.
 */
type Decimal = Enumerate<256>;

/**
 * A helper type to alias another type while eliding type resolution in IntelliSense.
 * @template T The type to be aliased
 */
type Alias<T> = T extends T ? T : T;

/**
 * An 8-bit foreground color.
 */
type FgColor = Alias<`38;5;${Decimal}`>;

/**
 * An 8-bit background color.
 */
type BgColor = Alias<`48;5;${Decimal}`>;

/**
 * An 8-bit underline color.
 */
type UlColor = Alias<`58;5;${Decimal}`>;

/**
 * A text styling attribute.
 */
type StyleAttr = TypeFace | Foreground | Background | Underline | FgColor | BgColor | UlColor;

/**
 * A callback that processes a format specifier when splitting text.
 * @param this The terminal string to append to
 * @param spec The format specifier (e.g., '%s')
 */
type FormatCallback = (this: TerminalString, spec: string) => void;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements concatenation of strings that can be printed on a terminal.
 */
class TerminalString {
  private merge = false;

  /**
   * The list of strings that have been appended.
   */
  readonly strings = new Array<string>();

  /**
   * The lengths of the strings, ignoring control characters and sequences.
   */
  readonly lengths = new Array<number>();

  /**
   * @returns The sum of the lengths of all strings, ignoring control characters and sequences.
   */
  get length(): number {
    return this.lengths.reduce((acc, len) => acc + len, 0);
  }

  /**
   * Creates a terminal string.
   * @param start The starting column for this string
   */
  constructor(public start: number = 0) {}

  /**
   * Appends another terminal string to the strings.
   * @param other The other terminal string
   * @returns The terminal string instance
   */
  addOther(other: TerminalString): this {
    this.strings.push(...other.strings);
    this.lengths.push(...other.lengths);
    this.merge = other.merge;
    return this;
  }

  /**
   * Sets a flag to merge the next word to the last word.
   * @param value The flag value
   * @returns The terminal string instance
   */
  setMerge(value = true): this {
    this.merge = value;
    return this;
  }

  /**
   * Appends a word that will be merged with the next word.
   * @param word The opening word
   * @returns The terminal string instance
   */
  addOpening(word: string): this {
    return this.addWord(word).setMerge();
  }

  /**
   * Appends a word that is merged with the last word.
   * @param word The closing word
   * @returns The terminal string instance
   */
  addClosing(word: string): this {
    return this.setMerge().addWord(word);
  }

  /**
   * Appends a word with surrounding sequences.
   * @param seq The starting sequence
   * @param word The word to be appended
   * @param rev The ending sequence
   * @returns The terminal string instance
   */
  addAndRevert(seq: Sequence, word: string, rev: Sequence): this {
    return this.addText(seq + word + rev, word.length);
  }

  /**
   * Appends a word to the list of strings.
   * @param words The word to be appended. Should not contain control characters or sequences.
   * @returns The terminal string instance
   */
  addWord(word: string): this {
    return this.addText(word, word.length);
  }

  /**
   * Appends line breaks to the list of strings.
   * @param words The number of line breaks to insert
   * @returns The terminal string instance
   */
  addBreaks(count: number): this {
    return count > 0 ? this.addText('\n'.repeat(count), 0) : this;
  }

  /**
   * Appends a sequence to the list of strings.
   * @param seq The sequence to insert
   * @returns The terminal string instance
   */
  addSequence(seq: Sequence): this {
    return this.addText(seq, 0);
  }

  /**
   * Appends a text that may contain control characters or sequences to the list of strings.
   * @param text The text to be appended
   * @param length The length of the text without control characters or sequences
   * @returns The terminal string instance
   */
  private addText(text: string, length: number): this {
    if (text) {
      const count = this.strings.length;
      if (count && this.merge) {
        this.strings[count - 1] += text;
        this.lengths[count - 1] += length;
      } else {
        this.strings.push(text);
        this.lengths.push(length);
      }
    }
    this.merge = false;
    return this;
  }

  /**
   * Splits a text into words and style sequences, and appends them to the list of strings.
   * @param text The text to be split
   * @param format A callback to process format specifiers
   * @returns The terminal string instance
   */
  splitText(text: string, format?: FormatCallback): this {
    const paragraphs = text.split(regex.para);
    paragraphs.forEach((para, i) => {
      this.splitParagraph(para, format);
      if (i < paragraphs.length - 1) {
        this.addBreaks(2);
      }
    });
    return this;
  }

  /**
   * Splits a paragraph into words and style sequences, and appends them to the list of strings.
   * @param para The paragraph to be split
   * @param format A callback to process format specifiers
   */
  private splitParagraph(para: string, format?: FormatCallback) {
    const count = this.strings.length;
    para.split(regex.item).forEach((item, i) => {
      if (i % 2 == 0) {
        this.splitItem(item, format);
      } else {
        if (this.strings.length > count) {
          this.addBreaks(1);
        }
        this.addWord(item);
      }
    });
  }

  /**
   * Splits a list item into words and style sequences, and appends them to the list of strings.
   * @param item The list item to be split
   * @param format A callback to process format specifiers
   */
  private splitItem(item: string, format?: FormatCallback) {
    const boundFormat = format?.bind(this);
    const words = item.split(regex.word);
    for (const word of words) {
      if (!word) {
        continue;
      }
      if (boundFormat) {
        const parts = word.split(regex.spec);
        if (parts.length > 1) {
          this.addWord(parts[0]);
          for (let i = 1, merge = parts[0] !== ''; i < parts.length; i += 2, merge = true) {
            this.setMerge(merge);
            boundFormat(parts[i]);
            this.addClosing(parts[i + 1]);
          }
          continue;
        }
      }
      const styles = word.match(regex.styles) ?? [];
      const length = styles.reduce((acc, str) => acc + str.length, 0);
      this.addText(word, word.length - length);
    }
  }

  /**
   * Wraps the strings to fit in a terminal width.
   * @param result The resulting strings to append to
   * @param column The current terminal column
   * @param width The desired terminal width (or zero to avoid wrapping)
   */
  wrapToWidth(result: Array<string>, column: number, width?: number): number {
    function shortenLine() {
      while (result.length && column > start) {
        const last = result[result.length - 1];
        if (last.length > column - start) {
          result[result.length - 1] = last.slice(0, start - column);
          break;
        }
        column -= last.length;
        result.length--;
      }
    }
    if (!this.strings.length) {
      return column;
    }
    const firstIsBreak = this.strings[0].startsWith('\n');
    let indent = '';
    let start = this.start;
    if (!width) {
      indent = ' '.repeat(start);
      if (!firstIsBreak) {
        if (column < start) {
          result.push(' '.repeat(start - column));
        } else {
          shortenLine();
        }
      }
    } else if (start) {
      if (width >= start + Math.max(...this.lengths)) {
        indent = move(start + 1, MoveCommand.cha);
        if (!firstIsBreak && column != start) {
          result.push(indent);
        }
      } else {
        if (!firstIsBreak && column) {
          result.push('\n');
        }
        start = 0;
      }
    } else if (!firstIsBreak && column) {
      result.push(move(1, MoveCommand.cha));
    }
    column = start;
    for (let i = 0; i < this.strings.length; ++i) {
      let str = this.strings[i];
      if (str.startsWith('\n')) {
        result.push(str);
        column = 0;
        continue;
      }
      const len = this.lengths[i];
      if (!len) {
        if (width) {
          result.push(str);
        }
        continue;
      }
      if (!width) {
        str = str.replace(regex.styles, '');
      }
      if (!column) {
        result.push(indent + str);
        column = start + len;
      } else if (column === start) {
        result.push(str);
        column += len;
      } else if (!width || column + 1 + len <= width) {
        result.push(' ' + str);
        column += 1 + len;
      } else {
        result.push('\n' + indent + str);
        column = start + len;
      }
    }
    return column;
  }
}

/**
 * An error message.
 */
class ErrorMessage extends Error {
  /**
   * Creates an error message
   * @param str The terminal string
   */
  constructor(readonly str: TerminalString) {
    super();
  }

  /**
   * @returns The message to be printed on a terminal
   */
  get message(): string {
    return this.wrap();
  }

  /**
   * Wraps the error message to a specified width.
   * @param width The terminal width (in number of columns)
   * @returns The message to be printed on a terminal
   */
  wrap(width = process.stderr.columns): string {
    const result = new Array<string>();
    this.str.wrapToWidth(result, 0, width);
    if (width) {
      result.push(style(TypeFace.clear));
    }
    return result.join('');
  }
}

/**
 * A help message.
 */
class HelpMessage extends Array<TerminalString> {
  /**
   * @returns the message to be printed on a terminal
   */
  override toString(): string {
    return this.wrap();
  }

  /**
   * Wraps the help message to a specified width.
   * @param width The terminal width (in number of columns)
   * @returns The message to be printed on a terminal
   */
  wrap(width = process.stdout.columns): string {
    const result = new Array<string>();
    let column = 0;
    for (const str of this) {
      column = str.wrapToWidth(result, column, width);
    }
    if (width) {
      result.push(style(TypeFace.clear));
    }
    return result.join('');
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Creates a CSI sequence.
 * @template P The type of the sequence parameter
 * @template C The type of the sequence command
 * @param param The sequence parameter
 * @param cmd The sequence command
 * @returns The CSI sequence
 */
function csi<P extends string | number, C extends Command>(param: P, cmd: C): CSI<P, C> {
  return `\x9b${param}${cmd}`;
}

/**
 * Creates a move sequence.
 * @param times The move parameter
 * @param cmd The move command
 * @returns The move sequence
 */
function move(times: number, cmd: MoveCommand): Move {
  return csi(times, cmd);
}

/**
 * Creates a move-to sequence.
 * @param x The horizontal position
 * @param y The vertical position
 * @returns The move-to sequence
 */
function moveTo(x: number, y: number): MoveTo {
  return csi(`${x};${y}`, MoveToCommand.cup);
}

/**
 * Creates an edit sequence.
 * @param times The edit parameter
 * @param cmd The edit command
 * @returns The edit sequence
 */
function edit(times: number, cmd: EditCommand): Edit {
  return csi(times, cmd);
}

/**
 * Creates a scroll sequence.
 * @param times The scroll parameter
 * @param cmd The scroll command
 * @returns The scroll sequence
 */
function scroll(times: number, cmd: ScrollCommand): Scroll {
  return csi(times, cmd);
}

/**
 * Creates an SGR sequence.
 * @param attrs The text styling attributes
 * @returns The SGR sequence
 */
function style(...attrs: Array<StyleAttr>): Style {
  return csi(attrs.join(';'), StyleCommand.sgr);
}

/**
 * Creates a margin sequence.
 * @param x The top margin
 * @param y The bottom margin
 * @returns The margin sequence
 */
function margin(x: number, y: number): Margin {
  return csi(`${x};${y}`, MarginCommand.tbm);
}

/**
 * Creates a foreground color.
 * @param color The color decimal value
 * @returns The foreground color
 */
function foreground(color: Decimal): FgColor {
  return `38;5;${color}`;
}

/**
 * Creates a background color.
 * @param color The color decimal value
 * @returns The background color
 */
function background(color: Decimal): BgColor {
  return `48;5;${color}`;
}

/**
 * Creates an underline color.
 * @param color The color decimal value
 * @returns The underline color
 */
function underline(color: Decimal): UlColor {
  return `58;5;${color}`;
}
