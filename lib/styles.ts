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
  isStyle,
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
type Style = CSI<string, StyleCommand>;

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
 * A text style attribute.
 */
type StyleAttr = TypeFace | Foreground | Background | Underline | FgColor | BgColor | UlColor;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements concatenation of strings that can be printed on a terminal.
 */
class TerminalString {
  private lastSequence: Sequence | undefined;

  /**
   * The list of strings that have been appended (sequences and text).
   */
  readonly strings = new Array<string>();

  /**
   * The length of the largest (non-sequence) text.
   */
  maxTextLen = 0;

  /**
   * The sum of the (non-sequence) text lengths.
   */
  length = 0;

  /**
   * Appends sequences to the list of strings.
   * @param sequences The sequences to be appended
   * @returns This
   */
  addSequence(...sequences: Array<Sequence>): this {
    for (const sequence of sequences) {
      if (sequence != this.lastSequence) {
        this.strings.push(sequence);
        this.lastSequence = sequence;
      }
    }
    return this;
  }

  /**
   * Appends texts to the list of strings.
   * @param texts The texts to be appended. Should not contain any sequence.
   * @returns This
   */
  addText(...texts: Array<string>): this {
    this.strings.push(...texts);
    for (const str of texts) {
      if (str.length > this.maxTextLen) {
        this.maxTextLen = str.length;
      }
      this.length += str.length;
    }
    return this;
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
 * @param attrs The text style attributes
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

/**
 * Tests if a string is a style sequence.
 * @param str The string to be checked
 * @returns True if the string is a style sequence
 */
function isStyle(str: string): str is Style {
  return str.match(/^(?:\x9b[\d;]+m)+$/) !== null;
}
